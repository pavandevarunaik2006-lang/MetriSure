from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.test_case import TestCase
from app.models.test_session import TestSession
from app.services.test_plan import generate_test_plan
from app.services.audit import log_action

router = APIRouter(prefix="/api/test-cases", tags=["test_cases"])

def serialize_test_case(tc: TestCase):
    display_status = tc.overall_result or tc.status
    return {
        "id": tc.id,
        "session_id": tc.session_id,
        "test_type": tc.test_type,
        "test_name": tc.test_name,
        "test_category": tc.test_type,
        "description": tc.notes,
        "sequence_number": tc.sequence_number,
        "status": display_status,
        "overall_result": tc.overall_result,
        "is_mandatory": tc.is_mandatory,
        "notes": tc.notes,
    }

@router.post("/generate/{session_id}")
@router.post("/session/{session_id}/generate")
def generate_cases(session_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    session = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    existing = db.query(TestCase).filter(TestCase.session_id == session_id).all()
    if existing:
        return {"message": f"Test plan already has {len(existing)} cases", "cases": [serialize_test_case(c) for c in existing]}
    cases = generate_test_plan(db, session_id)
    if session.status in ("DRAFT", "READY"):
        session.status = "IN_PROGRESS"
        db.commit()
    log_action(db, current_user.id, current_user.email, current_user.role, "GENERATE_PLAN", "TestSession", session_id)
    return {"message": f"Generated {len(cases)} test cases", "cases": [serialize_test_case(c) for c in cases]}

@router.get("/session/{session_id}")
def list_test_cases_by_session(session_id: int, db: Session = Depends(get_db)):
    cases = db.query(TestCase).filter(TestCase.session_id == session_id).order_by(TestCase.sequence_number).all()
    return [serialize_test_case(c) for c in cases]

@router.get("/{session_id}")
def list_test_cases(session_id: int, db: Session = Depends(get_db)):
    cases = db.query(TestCase).filter(TestCase.session_id == session_id).order_by(TestCase.sequence_number).all()
    return [serialize_test_case(c) for c in cases]

@router.put("/{id}/status")
def update_test_case_status(id: int, status_update: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    tc = db.query(TestCase).filter(TestCase.id == id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")
    new_status = status_update.get("status")
    if new_status in ("PASS", "FAIL"):
        tc.overall_result = new_status
        tc.status = "COMPLETED"
    elif new_status:
        tc.status = new_status
    db.commit()
    db.refresh(tc)
    log_action(db, current_user.id, current_user.email, current_user.role, "UPDATE_TEST_CASE", "TestCase", tc.id, new_status)
    return serialize_test_case(tc)
