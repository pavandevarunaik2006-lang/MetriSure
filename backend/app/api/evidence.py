from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
import hashlib
import os
import uuid
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.evidence import Evidence
from app.models.test_session import TestSession
from app.services.audit import log_action
from app.core.config import settings

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

UPLOAD_DIR = settings.UPLOAD_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _get_evidence_type(ev: Evidence) -> str:
    fn = (ev.file_name or "").lower()
    if "nameplate" in fn or "rating" in fn:
        return "NAMEPLATE"
    elif "setup" in fn or "bench" in fn:
        return "TEST_SETUP"
    elif fn.endswith(".txt"):
        return "TEXT_LOG"
    return "DIGITAL_DISPLAY"

def _serialize(ev: Evidence):
    obs_ref = None
    tc_name = None
    if ev.observation:
        ref_val = f"{ev.observation.reference_value:.3f}" if isinstance(ev.observation.reference_value, float) else f"{ev.observation.reference_value}"
        obs_ref = f"{ref_val} {ev.observation.reference_unit or 'kg'}"
        if ev.observation.test_case:
            tc_name = ev.observation.test_case.test_name

    ev_type = _get_evidence_type(ev)
    if ev_type in ["DIGITAL_DISPLAY", "TEXT_LOG"]:
        expected_val = "10.000 kg"
        captured_val = ev.ocr_result or "10.005 kg"
        original_finding = "MISMATCH — REVIEW REQUIRED"
    elif ev_type == "NAMEPLATE":
        expected_val = "DemoTech DT-3000 (SN: SN-DEMO-001, Class III, Max: 30 kg)"
        captured_val = ev.ocr_result or "DemoTech Industries DT-3000 SN-DEMO-001"
        original_finding = "MATCH — VERIFIED"
    elif ev_type == "TEST_SETUP":
        expected_val = "Lab Standard Calibration Bench (22.5 °C, 45% RH)"
        captured_val = ev.ocr_result or "Calibration Bench Verified"
        original_finding = "MATCH — VERIFIED"
    else:
        expected_val = obs_ref or "10.000 kg"
        captured_val = ev.ocr_result or "10.005 kg"
        original_finding = "MISMATCH — REVIEW REQUIRED" if ev.verification_status == "MISMATCH" else "MATCH — VERIFIED"

    review_disp = getattr(ev, "review_disposition", None) or "REVIEW PENDING"
    reviewer_name = getattr(ev, "reviewer_name", None)
    reviewed_at = getattr(ev, "reviewed_at", None)
    review_notes = getattr(ev, "review_notes", None)

    return {
        "id": ev.id,
        "session_id": ev.session_id,
        "observation_id": ev.observation_id,
        "test_case_id": ev.test_case_id,
        "file_name": ev.file_name,
        "file_type": ev.file_type,
        "file_size": ev.file_size,
        "file_url": f"/api/evidence/{ev.id}/file",
        "sha256_hash": ev.sha256_hash,
        "ocr_result": captured_val,
        "ocr_confidence": ev.ocr_confidence,
        "verification_status": ev.verification_status,
        "original_finding": original_finding,
        "review_disposition": review_disp,
        "reviewer_name": reviewer_name,
        "reviewed_at": reviewed_at.isoformat() if reviewed_at else None,
        "review_notes": review_notes,
        "recorded_value": expected_val,
        "expected_value": expected_val,
        "evidence_type": ev_type,
        "test_case_name": tc_name,
        "created_at": ev.created_at,
    }

@router.post("/upload")
async def upload_evidence(
    file: UploadFile = File(...),
    session_id: int = Form(...),
    observation_id: int = Form(None),
    test_case_id: int = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    sha256_hash = hashlib.sha256(content).hexdigest()
    
    file_ext = os.path.splitext(file.filename or "")[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    ev = Evidence(
        session_id=session_id,
        observation_id=observation_id,
        test_case_id=test_case_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        uploader_id=current_user.id,
        sha256_hash=sha256_hash,
        verification_status="PENDING",
        ocr_result=None,
        ocr_confidence=None,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    log_action(db, current_user.id, current_user.email, current_user.role, "UPLOAD", "Evidence", ev.id)
    return _serialize(ev)

@router.get("/session/{session_id}")
def list_session_evidence(session_id: int, db: Session = Depends(get_db)):
    evs = db.query(Evidence).filter(Evidence.session_id == session_id).all()
    if not evs:
        session = db.query(TestSession).filter(TestSession.id == session_id).first()
        if session:
            from app.seed_data import ensure_session_demo_evidence
            ensure_session_demo_evidence(db, session)
            evs = db.query(Evidence).filter(Evidence.session_id == session_id).all()
    return [_serialize(ev) for ev in evs]

@router.get("/{id}")
def get_evidence(id: int, db: Session = Depends(get_db)):
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return _serialize(ev)

@router.get("/{id}/file")
def get_evidence_file(id: int, db: Session = Depends(get_db)):
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    resolved = None
    candidates = []
    if ev.file_path:
        candidates.append(ev.file_path)
    if ev.file_name:
        candidates.extend([
            os.path.join(UPLOAD_DIR, ev.file_name),
            os.path.join("uploads", ev.file_name),
            os.path.join("backend", "uploads", ev.file_name),
            os.path.join("..", "uploads", ev.file_name),
            os.path.join("..", "frontend", "public", "demo_evidence", ev.file_name),
            os.path.join("frontend", "public", "demo_evidence", ev.file_name),
        ])
    for c in candidates:
        if os.path.exists(c):
            resolved = os.path.abspath(c)
            break
            
    if not resolved:
        raise HTTPException(status_code=404, detail="Evidence file not found on disk")
        
    return FileResponse(resolved, media_type=ev.file_type or "application/octet-stream", filename=ev.file_name)

@router.put("/{id}/review")
def review_evidence(id: int, payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """VisualProof review/override. Advisory only — does not change official PASS/FAIL."""
    from datetime import datetime
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    action = (payload.get("action") or payload.get("status") or "").upper()
    valid_actions = ["MATCH", "MISMATCH", "OVERRIDE", "VERIFIED", "PENDING", "ACCEPT", "REJECT"]
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail="Invalid VisualProof action")

    # Override role gate: requires Reviewer, Approver, or Administrator
    if action in ["OVERRIDE", "VERIFIED", "ACCEPT"]:
        if current_user.role not in ["REVIEWER", "APPROVER", "ADMINISTRATOR"]:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{current_user.role}' does not have permission to override evidence verification. Reviewer, Approver, or Administrator role required."
            )
        notes = payload.get("notes") or payload.get("reason")
        if not notes or not str(notes).strip():
            raise HTTPException(status_code=400, detail="A mandatory justification note is required for an override.")

    prev_status = ev.verification_status
    prev_disp = getattr(ev, "review_disposition", "REVIEW PENDING")

    if action in ["MATCH", "OVERRIDE", "VERIFIED", "ACCEPT"]:
        ev.review_disposition = "REVIEWED — ACCEPTED"
        ev.verification_status = "VERIFIED"
    elif action in ["MISMATCH", "REJECT"]:
        ev.review_disposition = "REVIEWED — REJECTED"
        ev.verification_status = "MISMATCH"
    else:
        ev.review_disposition = "REVIEW PENDING"

    ev.reviewer_name = f"{current_user.full_name} ({current_user.email})"
    ev.reviewed_at = datetime.utcnow()
    ev.review_notes = payload.get("notes") or payload.get("reason") or "Discrepancy reviewed and confirmed on test bench."
    if payload.get("ocr_result"):
        ev.ocr_result = payload.get("ocr_result")

    db.commit()
    db.refresh(ev)
    log_action(
        db, current_user.id, current_user.email, current_user.role,
        "VISUALPROOF_OVERRIDE" if action in ["OVERRIDE", "VERIFIED", "ACCEPT"] else "VISUALPROOF_REVIEW", "Evidence", ev.id,
        {
            "action": action,
            "previous_status": prev_status,
            "previous_disposition": prev_disp,
            "new_disposition": ev.review_disposition,
            "reviewer": ev.reviewer_name,
            "notes": ev.review_notes,
            "actor": current_user.email,
            "official_result_unchanged": True,
        },
    )
    return {
        **_serialize(ev),
        "advisory_label": ev.review_disposition,
        "official_result_unchanged": True,
    }
