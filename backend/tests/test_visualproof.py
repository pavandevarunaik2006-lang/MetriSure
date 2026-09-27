import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.test_session import TestSession
from app.models.test_case import TestCase
from app.models.evidence import Evidence
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_visualproof_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    from app.seed_data import seed_demo_data
    seed_demo_data(db)
    yield db
    db.close()

def _get_headers(role: str = "TECHNICIAN", email: str = "technician@metrisure.demo"):
    token = create_access_token({"sub": email, "role": role})
    return {"Authorization": f"Bearer {token}"}

def test_visualproof_seeded_evidence(setup_visualproof_data):
    """Verify seeded demo evidence images exist and are properly linked."""
    db = setup_visualproof_data
    session = db.query(TestSession).filter(TestSession.session_number == "TS-1045").first()
    assert session is not None

    res = client.get(f"/api/evidence/session/{session.id}")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 4

    filenames = [item["file_name"] for item in items]
    assert "demo_display_capture.txt" in filenames
    assert "demo_display_10_005kg.jpg" in filenames
    assert "demo_nameplate_sn001.jpg" in filenames
    assert "demo_test_setup.jpg" in filenames

    # Check Digital Display item
    display_item = next(i for i in items if i["file_name"] == "demo_display_10_005kg.jpg")
    assert display_item["ocr_result"] == "10.005 kg"
    assert display_item["verification_status"] == "MISMATCH"
    assert display_item["file_type"] == "image/jpeg"
    assert display_item["file_size"] > 0
    assert len(display_item["sha256_hash"]) == 64
    assert display_item["evidence_type"] == "DIGITAL_DISPLAY"

    # Check Nameplate item
    nameplate_item = next(i for i in items if i["file_name"] == "demo_nameplate_sn001.jpg")
    assert "DT-3000" in nameplate_item["ocr_result"]
    assert "SN-DEMO-001" in nameplate_item["ocr_result"]
    assert nameplate_item["verification_status"] == "MATCH"
    assert nameplate_item["evidence_type"] == "NAMEPLATE"

    # Check Test Setup item
    setup_item = next(i for i in items if i["file_name"] == "demo_test_setup.jpg")
    assert setup_item["verification_status"] == "VERIFIED"
    assert setup_item["evidence_type"] == "TEST_SETUP"

def test_visualproof_file_endpoint(setup_visualproof_data):
    """Verify GET /api/evidence/{id}/file serves image bytes."""
    db = setup_visualproof_data
    ev = db.query(Evidence).filter(Evidence.file_name == "demo_display_10_005kg.jpg").first()
    assert ev is not None

    res = client.get(f"/api/evidence/{ev.id}/file")
    assert res.status_code == 200
    assert "image/jpeg" in res.headers.get("content-type", "")
    assert len(res.content) == ev.file_size

def test_visualproof_technician_cannot_override(setup_visualproof_data):
    """Technician role cannot perform reviewer override."""
    db = setup_visualproof_data
    ev = db.query(Evidence).filter(Evidence.file_name == "demo_display_10_005kg.jpg").first()
    assert ev is not None

    headers = _get_headers(role="TECHNICIAN", email="technician@metrisure.demo")
    res = client.put(
        f"/api/evidence/{ev.id}/review",
        json={"action": "OVERRIDE", "notes": "Technician trying to override"},
        headers=headers
    )
    assert res.status_code == 403
    assert "does not have permission" in res.json()["detail"]

def test_visualproof_reviewer_override_requires_mandatory_note(setup_visualproof_data):
    """Reviewer override requires a non-empty justification note."""
    db = setup_visualproof_data
    ev = db.query(Evidence).filter(Evidence.file_name == "demo_display_10_005kg.jpg").first()
    assert ev is not None

    headers = _get_headers(role="REVIEWER", email="reviewer@metrisure.demo")
    res = client.put(
        f"/api/evidence/{ev.id}/review",
        json={"action": "OVERRIDE", "notes": ""},
        headers=headers
    )
    assert res.status_code == 400
    assert "justification note is required" in res.json()["detail"]

def test_visualproof_reviewer_override_does_not_modify_session_compliance(setup_visualproof_data):
    """VisualProof override modifies evidence status but does not alter session official result."""
    db = setup_visualproof_data
    session = db.query(TestSession).filter(TestSession.session_number == "TS-1045").first()
    ev = db.query(Evidence).filter(Evidence.file_name == "demo_display_10_005kg.jpg").first()
    original_session_status = session.status

    headers = _get_headers(role="REVIEWER", email="reviewer@metrisure.demo")
    res = client.put(
        f"/api/evidence/{ev.id}/review",
        json={
            "action": "OVERRIDE",
            "notes": "Verified by optical inspector: parallax reading discrepancy within tolerance.",
            "ocr_result": "10.000 kg"
        },
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["verification_status"] == "VERIFIED"
    assert res.json()["official_result_unchanged"] is True

    # Refresh session and ensure status hasn't mutated unexpectedly
    db.refresh(session)
    assert session.status == original_session_status

    # Reset back to MISMATCH for demo consistency
    ev.verification_status = "MISMATCH"
    ev.ocr_result = "10.005 kg"
    db.commit()
