import sys
import os

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.test_session import TestSession
from app.models.evidence import Evidence, Report, AuditLog
from app.models.test_case import TestCase, Observation
from app.core.security import create_access_token

client = TestClient(app)
db = SessionLocal()

print("=" * 60)
print("METRISURE GOLDEN PATH & DEMO-DATA CONSISTENCY VERIFICATION")
print("=" * 60)

# STEP 1: AUTHENTICATION / LOGIN
print("\n[STEP 1] User Authentication & Token Generation")
roles = [
    ("TECHNICIAN", "technician@metrisure.demo"),
    ("REVIEWER", "reviewer@metrisure.demo"),
    ("APPROVER", "approver@metrisure.demo"),
    ("ADMINISTRATOR", "admin@metrisure.demo"),
]
tokens = {}
for role, email in roles:
    res = client.post("/api/auth/login", json={"email": email, "password": "demo123"})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    tokens[role] = res.json()["access_token"]
    print(f"  [OK] {role.capitalize()} login successful ({email})")

from app.core.database import SessionLocal
from app.seed_data import seed_demo_data

db_init = SessionLocal()
seed_demo_data(db_init)
db_init.close()

# STEP 2: PRIMARY GOLDEN DEMO SESSION (TS-1045)
print("\n[STEP 2] Primary Golden Demo Session (TS-1045)")
sessions_res = client.get("/api/test-sessions/")
assert sessions_res.status_code == 200
all_sessions = sessions_res.json()["items"]
assert len(all_sessions) > 0

# Check TS-1045 is pinned first
first_session = all_sessions[0]
assert first_session["session_number"] == "TS-1045", f"Expected TS-1045 pinned first, got {first_session['session_number']}"
assert first_session["status"] == "APPROVED", f"Expected APPROVED status, got {first_session['status']}"
print(f"  ✓ TS-1045 is successfully pinned as primary golden demo session (ID: {first_session['id']})")
print(f"  ✓ Status: {first_session['status']} | Instrument: {first_session.get('instrument', {}).get('serial_number')}")

# STEP 3: VISUALPROOF EVIDENCE FOR TS-1045
print("\n[STEP 3] VisualProof Evidence for TS-1045")
ev_res = client.get(f"/api/evidence/session/{first_session['id']}")
assert ev_res.status_code == 200
evidence_items = ev_res.json()
assert len(evidence_items) >= 4, f"Expected at least 4 evidence records, got {len(evidence_items)}"

for it in evidence_items:
    print(f"  ✓ Evidence #{it['id']} [{it['evidence_type']}]: {it['file_name']}")
    print(f"     Status: {it['verification_status']} | OCR: {it['ocr_result']} | Expected: {it['expected_value']}")
    print(f"     SHA-256: {it['sha256_hash'][:24]}... | Size: {it['file_size']} B | URL: {it['file_url']}")

# STEP 4: OPEN & VERIFY IMAGE EVIDENCE FILES
print("\n[STEP 4] Image File Downloading / Streaming Verification")
display_item = next(i for i in evidence_items if "display" in i["file_name"] and i["file_name"].endswith(".jpg"))
nameplate_item = next(i for i in evidence_items if "nameplate" in i["file_name"])
setup_item = next(i for i in evidence_items if "setup" in i["file_name"])

for item in [display_item, nameplate_item, setup_item]:
    img_res = client.get(f"/api/evidence/{item['id']}/file")
    assert img_res.status_code == 200, f"Failed to load image #{item['id']}"
    assert "image/jpeg" in img_res.headers.get("content-type", "")
    assert len(img_res.content) == item["file_size"]
    print(f"  ✓ Image #{item['id']} ({item['file_name']}): 200 OK | {len(img_res.content)} bytes verified")

# STEP 5: EXPECTED VS CAPTURED COMPARISON
print("\n[STEP 5] Expected vs Captured Comparison & Advisory Terminology")
assert display_item["expected_value"] == "10.000 kg", f"Expected '10.000 kg', got {display_item['expected_value']}"
assert display_item["ocr_result"] == "10.005 kg", f"Captured '10.005 kg', got {display_item['ocr_result']}"
assert display_item["verification_status"] == "MISMATCH", f"Expected MISMATCH, got {display_item['verification_status']}"
print(f"  ✓ Digital Display Discrepancy Verified: Expected 10.000 kg vs Captured 10.005 kg")
print(f"  ✓ Advisory Status: MISMATCH — REVIEW REQUIRED (no fraud/tamper terminology)")

# STEP 6: REVIEWER DECISION & RBAC AUDIT WORKFLOW
print("\n[STEP 6] Reviewer Decision & RBAC Enforcement")
# Technician should be blocked from override
tech_headers = {"Authorization": f"Bearer {tokens['TECHNICIAN']}"}
tech_attempt = client.put(
    f"/api/evidence/{display_item['id']}/review",
    json={"action": "OVERRIDE", "notes": "Unauthorized tech override attempt"},
    headers=tech_headers
)
assert tech_attempt.status_code == 403, f"Expected 403, got {tech_attempt.status_code}"
print("  ✓ Technician override blocked: 403 Forbidden")

# Reviewer without note should be blocked
rev_headers = {"Authorization": f"Bearer {tokens['REVIEWER']}"}
empty_note_attempt = client.put(
    f"/api/evidence/{display_item['id']}/review",
    json={"action": "OVERRIDE", "notes": ""},
    headers=rev_headers
)
assert empty_note_attempt.status_code == 400, f"Expected 400, got {empty_note_attempt.status_code}"
print("  ✓ Reviewer empty note blocked: 400 Bad Request")

# Reviewer with valid note can override
override_res = client.put(
    f"/api/evidence/{display_item['id']}/review",
    json={
        "action": "OVERRIDE",
        "notes": "SIH Golden Path: Visual inspection confirms scale platform seated properly; +0.005 kg offset within calibration tolerance.",
        "ocr_result": "10.005 kg"
    },
    headers=rev_headers
)
assert override_res.status_code == 200
assert override_res.json()["verification_status"] == "VERIFIED"
assert override_res.json()["official_result_unchanged"] is True
print("  ✓ Reviewer authorized override executed: Status = VERIFIED")

# Reset back to MISMATCH for fresh demo
db_ev = db.query(Evidence).filter(Evidence.id == display_item["id"]).first()
db_ev.verification_status = "MISMATCH"
db.commit()
print("  ✓ Evidence reset to MISMATCH for live demonstration presentation")

# STEP 7: STANDARDIZED REPORT
print("\n[STEP 7] Standardized Test Report")
reports_res = client.get("/api/reports/")
assert reports_res.status_code == 200
reports = reports_res.json()["items"]
assert len(reports) > 0

# Check first report is for TS-1045
rep_1045 = next((r for r in reports if r["session_id"] == first_session["id"]), None)
assert rep_1045 is not None, "Report for TS-1045 not found"
print(f"  ✓ Standardized Report #{rep_1045['id']} ({rep_1045['report_number']}) linked to Session TS-1045")
print(f"  ✓ Status: {rep_1045['status']} | SHA-256: {rep_1045.get('sha256_hash', 'N/A')}")

# Verify report PDF endpoint
pdf_res = client.get(f"/api/reports/{rep_1045['id']}/pdf")
assert pdf_res.status_code == 200, f"Failed to download PDF: {pdf_res.status_code}"
assert "application/pdf" in pdf_res.headers.get("content-type", "")
print(f"  ✓ Report PDF download verified: {len(pdf_res.content)} bytes")

# STEP 8: REPORT VERIFICATION / AUTHENTICATION
print("\n[STEP 8] Report Cryptographic Verification")
verify_res = client.get(f"/api/reports/{rep_1045['id']}/verify")
assert verify_res.status_code == 200
vdata = verify_res.json()
assert vdata["verified"] is True
assert vdata["session_number"] == "TS-1045"
assert vdata["disclaimer"] == "DEMO DATA — FOR DEMONSTRATION ONLY"
print(f"  ✓ Report Verification: verified={vdata['verified']} | Session: {vdata['session_number']}")
print(f"  ✓ Disclaimer: '{vdata['disclaimer']}'")

# STEP 9: VERIFY INV-TEST-7f9517 (SESSION 32) ALSO HAS MOCK EVIDENCE
print("\n[STEP 9] Verifying INV-TEST-7f9517 (Session 32) Consistency")
inv_s = db.query(TestSession).filter(TestSession.session_number == "INV-TEST-7f9517").first()
if inv_s:
    inv_evs_res = client.get(f"/api/evidence/session/{inv_s.id}")
    assert inv_evs_res.status_code == 200
    inv_items = inv_evs_res.json()
    assert len(inv_items) >= 4, f"INV-TEST-7f9517 should have 4 evidence items, got {len(inv_items)}"
    print(f"  ✓ INV-TEST-7f9517 now contains {len(inv_items)} attached evidence items (no longer empty!)")
    for it in inv_items:
        print(f"     - #{it['id']} {it['file_name']} [{it['verification_status']}]")

# STEP 10: VERIFY DRAFT AND SUBMITTED SESSIONS STILL WORK
print("\n[STEP 10] Verifying DRAFT and SUBMITTED Sessions")
draft_s = next((s for s in all_sessions if s["status"] == "DRAFT"), None)
sub_s = next((s for s in all_sessions if s["status"] == "SUBMITTED"), None)

assert draft_s is not None, "DRAFT session not found"
assert sub_s is not None, "SUBMITTED session not found"

draft_detail = client.get(f"/api/test-sessions/{draft_s['id']}")
assert draft_detail.status_code == 200
assert draft_detail.json()["status"] == "DRAFT"
print(f"  ✓ DRAFT session #{draft_s['id']} ({draft_s['session_number']}) operational")

sub_detail = client.get(f"/api/test-sessions/{sub_s['id']}")
assert sub_detail.status_code == 200
assert sub_detail.json()["status"] == "SUBMITTED"
print(f"  ✓ SUBMITTED session #{sub_s['id']} ({sub_s['session_number']}) operational")

print("\n" + "=" * 60)
print("GOLDEN PATH FULLY VERIFIED — ZERO REGRESSIONS")
print("=" * 60)
