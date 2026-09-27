from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import require_role, get_current_user
from app.models.test_session import TestSession
from app.models.evidence import ApprovalRecord, Evidence, AuditLog
from app.models.instrument import Instrument
from app.models.user import User
from app.services.audit import log_action
from pydantic import BaseModel

router = APIRouter(prefix="/api/review", tags=["review"])

class ReviewRequest(BaseModel):
    action: str
    notes: str = ""

def _load_session(db: Session, session_id: int):
    return db.query(TestSession).options(
        joinedload(TestSession.instrument).joinedload(Instrument.model),
        joinedload(TestSession.test_cases),
        joinedload(TestSession.laboratory),
    ).filter(TestSession.id == session_id).first()

@router.get("/queue")
def review_queue(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    statuses = ["SUBMITTED", "UNDER_REVIEW", "REVIEWED", "CHANGES_REQUESTED", "COMPLETED", "APPROVED", "REJECTED"]
    sessions = db.query(TestSession).options(
        joinedload(TestSession.instrument).joinedload(Instrument.model),
        joinedload(TestSession.laboratory),
    ).filter(TestSession.status.in_(statuses)).order_by(TestSession.created_at.desc()).all()
    return {"items": sessions, "total": len(sessions)}

@router.post("/{session_id}/submit")
def submit_review(session_id: int, db: Session = Depends(get_db), current_user = Depends(require_role(["TECHNICIAN", "ADMINISTRATOR"]))):
    session = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = "SUBMITTED"
    db.commit()
    log_action(db, current_user.id, current_user.email, current_user.role, "SUBMIT", "TestSession", session_id)
    return {"message": "Submitted for review", "status": session.status}

@router.post("/{session_id}/reviewer-action")
def reviewer_action(session_id: int, req: ReviewRequest, db: Session = Depends(get_db), current_user = Depends(require_role(["REVIEWER", "ADMINISTRATOR"]))):
    session = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if req.action == "APPROVE":
        session.status = "REVIEWED"
    elif req.action == "REQUEST_CHANGES":
        session.status = "CHANGES_REQUESTED"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    record = ApprovalRecord(
        session_id=session.id,
        reviewer_id=current_user.id,
        action=req.action,
        notes=req.notes
    )
    db.add(record)
    db.commit()
    log_action(db, current_user.id, current_user.email, current_user.role, f"REVIEWER_{req.action}", "TestSession", session_id)
    return {"message": "Review recorded", "status": session.status}

def _run_reportguard_check(db: Session, session: TestSession):
    issues = []
    
    # 1. Environmental Conditions Check
    env_ok = session.env_temperature is not None and session.env_humidity is not None
    if not env_ok:
        issues.append("Missing environmental conditions (temperature or humidity)")

    # 2. Test Execution & Observation Completeness
    has_tests = bool(session.test_cases)
    missing_obs = [tc.test_name for tc in session.test_cases if not tc.observations]
    if not has_tests:
        issues.append("No test cases generated for session")
    elif missing_obs:
        issues.append(f"Incomplete observations in test case(s): {', '.join(missing_obs)}")

    # 3. VisualProof Evidence Integrity
    ev_items = db.query(Evidence).filter(Evidence.session_id == session.id).all()
    has_mismatch = any(
        (e.verification_status == "MISMATCH" and getattr(e, "review_disposition", None) != "REVIEWED — ACCEPTED")
        for e in ev_items
    )
    if has_mismatch:
        issues.append("Unresolved VisualProof display mismatch detected (reviewer override/verification required)")

    # 4. TestGuard Advisory Status
    has_testguard_flag = bool(session.env_notes and "[TESTGUARD REVIEW RECOMMENDED" in session.env_notes)
    if has_testguard_flag:
        issues.append("Active TestGuard advisory flag: REVIEW RECOMMENDED")

    # 5. Review & Approval Status
    is_reviewed_or_approved = session.status in ["REVIEWED", "APPROVED"]
    if not is_reviewed_or_approved:
        if session.status in ["SUBMITTED", "UNDER_REVIEW", "COMPLETED"]:
            issues.append(f"Formal peer review required prior to report issuance (Current status: {session.status})")
        else:
            issues.append(f"Session is in '{session.status}' status; review/approval required")

    checks = [
        {
            "name": "Environmental Conditions Completeness",
            "status": "PASS" if env_ok else "BLOCKED",
            "explanation": f"Recorded {session.env_temperature} °C, {session.env_humidity} % humidity" if env_ok else "Environmental temperature or humidity parameters missing.",
            "affected_entity": f"Session {session.session_number}",
            "action_link": f"/test-sessions/{session.id}"
        },
        {
            "name": "Test Sequence & Observation Completeness",
            "status": "PASS" if (has_tests and not missing_obs) else "BLOCKED",
            "explanation": f"All {len(session.test_cases)} test sequences have recorded measurement observations." if (has_tests and not missing_obs) else f"{len(missing_obs)} test sequence(s) lack observations.",
            "affected_entity": "Test Execution Observations",
            "action_link": f"/test-execution/{session.id}"
        },
        {
            "name": "VisualProof Evidence Verification",
            "status": "BLOCKED" if has_mismatch else ("PASS" if ev_items else "REVIEW"),
            "explanation": "Evidence display capture verified without outstanding mismatch." if (ev_items and not has_mismatch) else ("Physical display mismatch flagged — reviewer override/disposition required before report issuance." if has_mismatch else "No physical display evidence uploaded for session."),
            "affected_entity": "VisualProof Optical Evidence",
            "action_link": f"/visualproof/{session.id}"
        },
        {
            "name": "TestGuard Advisory Analysis",
            "status": "REVIEW" if has_testguard_flag else "PASS",
            "explanation": "TestGuard advisory flag recorded: REVIEW RECOMMENDED." if has_testguard_flag else "No active TestGuard blocking flags.",
            "affected_entity": "TestGuard AI Advisory",
            "action_link": f"/testguard/{session.id}"
        },
        {
            "name": "Compliance Engine Verification",
            "status": "PASS" if session.status in ["COMPLETED", "SUBMITTED", "REVIEWED", "APPROVED"] else "BLOCKED",
            "explanation": f"Deterministic compliance evaluation complete (Session status: {session.status}).",
            "affected_entity": "Deterministic Compliance Engine",
            "action_link": f"/results/{session.id}"
        },
        {
            "name": "Formal Review Prerequisite",
            "status": "PASS" if is_reviewed_or_approved else "REVIEW",
            "explanation": "Peer metrological review completed." if is_reviewed_or_approved else f"Current session status is '{session.status}'. Formal peer review sign-off required before final approval.",
            "affected_entity": "Review Workspace",
            "action_link": f"/review/{session.id}"
        }
    ]

    has_blocked = any(c["status"] == "BLOCKED" for c in checks)
    has_review = any(c["status"] == "REVIEW" for c in checks)

    if has_blocked:
        overall_status = "BLOCKED"
    elif has_review and not is_reviewed_or_approved:
        overall_status = "REVIEW REQUIRED"
    elif is_reviewed_or_approved:
        overall_status = "READY FOR REPORT ISSUANCE"
    else:
        overall_status = "READY FOR APPROVAL"

    return {
        "status": overall_status,
        "is_ready": not has_blocked,
        "issues": issues,
        "checks": checks,
        "session_id": session.id,
        "session_number": session.session_number,
        "session_status": session.status,
    }

@router.post("/{session_id}/approver-action")
def approver_action(session_id: int, req: ReviewRequest, db: Session = Depends(get_db), current_user = Depends(require_role(["APPROVER", "ADMINISTRATOR"]))):
    session = _load_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    report_id = None
    if req.action == "FINAL_APPROVE":
        rg_result = _run_reportguard_check(db, session)
        if not rg_result["is_ready"]:
            blocked_reasons = [c["explanation"] for c in rg_result["checks"] if c["status"] == "BLOCKED"]
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve session: ReportGuard quality gates are BLOCKED. {'; '.join(blocked_reasons)}"
            )
        session.status = "APPROVED"
        try:
            from app.api.reports import _generate_pdf_and_record, _load_session as _load_report_session
            report_session = _load_report_session(db, session_id)
            report = _generate_pdf_and_record(db, report_session, current_user)
            report_id = report.id
        except Exception as rep_err:
            print("Auto report generation notice:", rep_err)
    elif req.action == "REQUEST_CHANGES":
        session.status = "CHANGES_REQUESTED"
    elif req.action == "REJECT":
        session.status = "REJECTED"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    record = ApprovalRecord(
        session_id=session.id,
        approver_id=current_user.id,
        action=req.action,
        notes=req.notes
    )
    db.add(record)
    db.commit()
    log_action(db, current_user.id, current_user.email, current_user.role, f"APPROVER_{req.action}", "TestSession", session_id)
    return {"message": "Approval recorded", "status": session.status, "report_id": report_id}

@router.get("/{session_id}/diff")
def approval_diff(session_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    session = _load_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    prior = db.query(TestSession).filter(
        TestSession.instrument_id == session.instrument_id,
        TestSession.id != session.id,
        TestSession.status.in_(["APPROVED", "COMPLETED"]),
    ).order_by(TestSession.created_at.desc()).first()
    records = db.query(ApprovalRecord).filter(ApprovalRecord.session_id == session_id).order_by(ApprovalRecord.id.desc()).all()
    approval_items = []
    for r in records:
        actor = db.query(User).filter(User.id == (r.approver_id or r.reviewer_id)).first() if (r.approver_id or r.reviewer_id) else None
        approval_items.append({
            "id": r.id,
            "action": r.action,
            "notes": r.notes or "",
            "reviewer_id": r.reviewer_id,
            "approver_id": r.approver_id,
            "actor_email": actor.email if actor else ("approver@metrisure.demo" if r.approver_id else ("reviewer@metrisure.demo" if r.reviewer_id else "System")),
            "actor_role": actor.role if actor else ("APPROVER" if r.approver_id else "REVIEWER"),
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(r, "created_at") and r.created_at else None,
        })

    session_audits = db.query(AuditLog).filter(
        AuditLog.entity_id == str(session_id),
        AuditLog.entity_type == "TestSession"
    ).order_by(AuditLog.timestamp.desc()).all()
    audit_items = [
        {
            "id": a.id,
            "action": a.action,
            "user_email": a.user_email,
            "user_role": a.user_role,
            "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S") if a.timestamp else None,
            "details": a.details,
        }
        for a in session_audits
    ]

    return {
        "current": {
            "id": session.id,
            "session_number": session.session_number,
            "instrument_id": session.instrument_id,
            "status": session.status,
            "rulepack_version": session.rulepack_version,
            "env_temperature": session.env_temperature,
            "env_humidity": session.env_humidity,
            "env_atmospheric_pressure": session.env_atmospheric_pressure,
            "failed_cases": sum(1 for tc in session.test_cases if tc.overall_result == "FAIL"),
        },
        "baseline": {
            "id": prior.id if prior else None,
            "session_number": prior.session_number if prior else None,
            "status": prior.status if prior else None,
            "rulepack_version": prior.rulepack_version if prior else session.rulepack_version,
            "env_temperature": prior.env_temperature if prior else None,
            "env_humidity": prior.env_humidity if prior else None,
            "env_atmospheric_pressure": prior.env_atmospheric_pressure if prior else None,
            "failed_cases": sum(1 for tc in prior.test_cases if tc.overall_result == "FAIL") if prior else 0,
        } if prior else None,
        "approval_records": approval_items,
        "session_audits": audit_items,
        "disclaimer": "DEMO DATA — FOR DEMONSTRATION ONLY",
    }

@router.get("/{session_id}/reportguard")
def reportguard_check(session_id: int, db: Session = Depends(get_db)):
    session = _load_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _run_reportguard_check(db, session)
