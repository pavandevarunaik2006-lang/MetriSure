import sys
import os
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.evidence import Evidence, AuditLog
from app.models.test_session import TestSession
from app.core.security import create_access_token

client = TestClient(app)
db = SessionLocal()

print("=== 1. CHECKING TEST SESSIONS & SEEDED EVIDENCE ===")
session = db.query(TestSession).filter(TestSession.session_number == "TS-1045").first()
assert session is not None, "Session TS-1045 not found"
print(f"Session {session.session_number} (ID={session.id}), Status: {session.status}")

evs = db.query(Evidence).filter(Evidence.session_id == session.id).order_by(Evidence.id).all()
print(f"Found {len(evs)} seeded evidence records:")
for e in evs:
    print(f"  [ID {e.id}] {e.file_name} | Type: {e.file_type} | Status: {e.verification_status} | OCR: {e.ocr_result} | Size: {e.file_size} B")

# Ensure we have all 4 expected records
expected_files = ["demo_display_capture.txt", "demo_display_10_005kg.jpg", "demo_nameplate_sn001.jpg", "demo_test_setup.jpg"]
actual_files = [e.file_name for e in evs]
for ef in expected_files:
    assert ef in actual_files, f"Missing evidence file: {ef}"

print("\n=== 2. TESTING GET /api/evidence/session/{id} ===")
res = client.get(f"/api/evidence/session/{session.id}")
assert res.status_code == 200
items = res.json()
assert len(items) == len(evs)
for it in items:
    print(f"  API Item #{it['id']}: {it['file_name']} -> {it['evidence_type']} | Status: {it['verification_status']} | URL: {it['file_url']}")

print("\n=== 3. TESTING IMAGE FILE SERVING ENDPOINTS ===")
for it in items:
    f_res = client.get(f"/api/evidence/{it['id']}/file")
    assert f_res.status_code == 200, f"Failed to get file for evidence {it['id']}"
    assert len(f_res.content) == it["file_size"], f"Size mismatch for evidence {it['id']}"
    print(f"  File #{it['id']} ({it['file_name']}): 200 OK | Content-Type: {f_res.headers.get('content-type')} | Bytes: {len(f_res.content)}")

print("\n=== 4. TESTING RBAC FOR TECHNICIAN OVERRIDE ATTEMPT ===")
tech_token = create_access_token({"sub": "technician@metrisure.demo", "role": "TECHNICIAN"})
display_ev = next(e for e in evs if e.file_name == "demo_display_10_005kg.jpg")
res_tech = client.put(
    f"/api/evidence/{display_ev.id}/review",
    json={"action": "OVERRIDE", "notes": "Unauthorized tech override"},
    headers={"Authorization": f"Bearer {tech_token}"}
)
assert res_tech.status_code == 403, f"Expected 403 for technician override, got {res_tech.status_code}"
print("  Technician override blocked with 403 Forbidden: PASS")

print("\n=== 5. TESTING REVIEWER OVERRIDE MANDATORY NOTE VALIDATION ===")
rev_token = create_access_token({"sub": "reviewer@metrisure.demo", "role": "REVIEWER"})
res_rev_empty = client.put(
    f"/api/evidence/{display_ev.id}/review",
    json={"action": "OVERRIDE", "notes": ""},
    headers={"Authorization": f"Bearer {rev_token}"}
)
assert res_rev_empty.status_code == 400, f"Expected 400 for empty note, got {res_rev_empty.status_code}"
print("  Reviewer override without note blocked with 400 Bad Request: PASS")

print("\n=== 6. TESTING AUTHORIZED REVIEWER OVERRIDE ===")
res_rev_ok = client.put(
    f"/api/evidence/{display_ev.id}/review",
    json={
        "action": "OVERRIDE",
        "notes": "SIH Demo: Visual inspection confirms +0.005 kg reading corresponds to non-zero tare offset; within MPE tolerance. Verified by Reviewer Rajesh Kumar.",
        "ocr_result": "10.005 kg"
    },
    headers={"Authorization": f"Bearer {rev_token}"}
)
assert res_rev_ok.status_code == 200, f"Expected 200 for valid override, got {res_rev_ok.status_code}"
assert res_rev_ok.json()["verification_status"] == "VERIFIED"
assert res_rev_ok.json()["official_result_unchanged"] is True
print("  Reviewer override successfully executed. Status updated to VERIFIED: PASS")

# Verify audit trail
audit = db.query(AuditLog).filter(AuditLog.entity_id == str(display_ev.id), AuditLog.action == "VISUALPROOF_OVERRIDE").first()
assert audit is not None, "Audit record missing"
print(f"  Audit Log recorded: action={audit.action}, user={audit.user_email}, role={audit.user_role}")

# Reset display evidence back to MISMATCH for live demo
display_ev.verification_status = "MISMATCH"
db.commit()
print("  Reset status back to MISMATCH for fresh SIH demonstration state: PASS")

print("\n=== ALL SMOKE TESTS PASSED CLEANLY! ===")
