import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models.test_session import TestSession
from app.models.evidence import Evidence, Report
from app.models.instrument import Instrument
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    from app.seed_data import seed_demo_data
    seed_demo_data(db)
    yield db
    db.close()

def _auth_headers(role: str = "ADMINISTRATOR", email: str = "admin@metrisure.demo"):
    token = create_access_token({"sub": email, "role": role})
    return {"Authorization": f"Bearer {token}"}

def test_visualproof_expected_and_recorded_values(setup_test_db):
    """Blocker 4: Ensure recorded_value and expected_value are 10.000 kg and captured is 10.005 kg."""
    db = setup_test_db
    session = db.query(TestSession).filter(TestSession.session_number == "TS-1045").first()
    assert session is not None

    res = client.get(f"/api/evidence/session/{session.id}")
    assert res.status_code == 200
    items = res.json()

    display_item = next((i for i in items if i["file_name"] == "demo_display_10_005kg.jpg"), None)
    assert display_item is not None
    assert display_item["expected_value"] == "10.000 kg"
    assert display_item["recorded_value"] == "10.000 kg"
    assert display_item["ocr_result"] == "10.005 kg"
    assert display_item["original_finding"] == "MISMATCH — REVIEW REQUIRED"

def test_visualproof_override_preserves_original_finding(setup_test_db):
    """Blocker 3: Reviewer override sets disposition to REVIEWED — ACCEPTED without changing original_finding."""
    db = setup_test_db
    ev = db.query(Evidence).filter(Evidence.file_name == "demo_display_10_005kg.jpg").first()
    assert ev is not None

    headers = _auth_headers(role="REVIEWER", email="reviewer@metrisure.demo")
    override_note = "Discrepancy of 0.005 kg (+0.5 e) confirmed due to display rounding. Test bench reading verified."
    res = client.put(
        f"/api/evidence/{ev.id}/review",
        json={"action": "OVERRIDE", "notes": override_note},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["original_finding"] == "MISMATCH — REVIEW REQUIRED"
    assert data["review_disposition"] == "REVIEWED — ACCEPTED"
    assert data["verification_status"] == "VERIFIED"
    assert data["review_notes"] == override_note
    assert "reviewer@metrisure.demo" in (data["reviewer_name"] or "")

def test_reportguard_blocks_on_unresolved_mismatch(setup_test_db):
    """Blocker 1 & 3: ReportGuard VisualProof check is BLOCKED when an unreviewed mismatch exists."""
    db = setup_test_db
    session = db.query(TestSession).filter(TestSession.session_number == "TS-1045").first()
    ev = db.query(Evidence).filter(Evidence.file_name == "demo_display_10_005kg.jpg").first()

    # Set evidence to unresolved mismatch
    ev.verification_status = "MISMATCH"
    ev.review_disposition = "REVIEW PENDING"
    db.commit()

    res = client.get(f"/api/review/{session.id}/reportguard")
    assert res.status_code == 200
    rg = res.json()
    assert rg["status"] == "BLOCKED"
    assert rg["is_ready"] is False

    vp_check = next((c for c in rg["checks"] if c["name"] == "VisualProof Evidence Verification"), None)
    assert vp_check is not None
    assert vp_check["status"] == "BLOCKED"

def test_final_approval_rejected_when_reportguard_blocked(setup_test_db):
    """Blocker 1: Approver action returns HTTP 400 when ReportGuard prerequisites are BLOCKED."""
    db = setup_test_db
    session = db.query(TestSession).filter(TestSession.session_number == "TS-1045").first()
    ev = db.query(Evidence).filter(Evidence.file_name == "demo_display_10_005kg.jpg").first()

    ev.verification_status = "MISMATCH"
    ev.review_disposition = "REVIEW PENDING"
    db.commit()

    headers = _auth_headers(role="APPROVER", email="approver@metrisure.demo")
    res = client.post(
        f"/api/review/{session.id}/approver-action",
        json={"action": "FINAL_APPROVE", "notes": "Attempting approval while blocked"},
        headers=headers
    )
    assert res.status_code == 400
    assert "BLOCKED" in res.json()["detail"]

def test_final_approval_succeeds_and_issues_report_when_ready(setup_test_db):
    """Blocker 1: When ready, Final Approval commits APPROVED status and issues report with SHA-256 hash."""
    db = setup_test_db
    session = db.query(TestSession).filter(TestSession.session_number == "TS-1045").first()
    ev = db.query(Evidence).filter(Evidence.file_name == "demo_display_10_005kg.jpg").first()

    # Accept the mismatch
    ev.verification_status = "VERIFIED"
    ev.review_disposition = "REVIEWED — ACCEPTED"
    ev.review_notes = "Confirmed by reviewer on test bench."
    session.status = "REVIEWED"
    db.commit()

    # ReportGuard should now be ready
    rg_res = client.get(f"/api/review/{session.id}/reportguard")
    assert rg_res.status_code == 200
    assert rg_res.json()["is_ready"] is True

    # Final approval
    headers = _auth_headers(role="APPROVER", email="approver@metrisure.demo")
    res = client.post(
        f"/api/review/{session.id}/approver-action",
        json={"action": "FINAL_APPROVE", "notes": "Session fully validated and verified."},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "APPROVED"
    assert data["report_id"] is not None

    # Check report record
    report = db.query(Report).filter(Report.id == data["report_id"]).first()
    assert report is not None
    assert report.status == "ISSUED"
    assert len(report.sha256_hash) == 64
    assert os.path.exists(report.file_path)

def test_golden_demo_session_ts1045(setup_test_db):
    """Blocker 5: Verify TS-1045 is the primary golden demo case with instrument SN-DEMO-001."""
    db = setup_test_db
    session = db.query(TestSession).filter(TestSession.session_number == "TS-1045").first()
    assert session is not None
    assert session.instrument is not None
    assert session.instrument.serial_number == "SN-DEMO-001"
    assert session.status == "APPROVED"

    # Evidence items
    ev_items = db.query(Evidence).filter(Evidence.session_id == session.id).all()
    assert len(ev_items) >= 4
    filenames = [e.file_name for e in ev_items]
    assert "demo_display_10_005kg.jpg" in filenames
    assert "demo_nameplate_sn001.jpg" in filenames
    assert "demo_test_setup.jpg" in filenames
