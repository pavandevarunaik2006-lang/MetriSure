from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import joinedload, Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.instrument import Instrument
from app.models.test_session import TestSession
from app.models.notification import Notification
from app.models.user import User
from app.schemas.test_session import TestSessionCreate, TestSessionResponse, TestSessionListResponse, EnvironmentalConditions
from app.services.audit import log_action
from datetime import datetime

router = APIRouter(prefix="/api/test-sessions", tags=["test_sessions"])

def _session_query(db: Session):
    return db.query(TestSession).options(
        joinedload(TestSession.instrument).joinedload(Instrument.model),
        joinedload(TestSession.instrument).joinedload(Instrument.laboratory),
        joinedload(TestSession.laboratory),
    )

from sqlalchemy import case

@router.get("/", response_model=TestSessionListResponse)
def list_sessions(status: str = None, instrument_id: int = None, db: Session = Depends(get_db)):
    query = _session_query(db)
    if status:
        query = query.filter(TestSession.status == status)
    if instrument_id:
        query = query.filter(TestSession.instrument_id == instrument_id)
    items = query.order_by(
        case(
            (TestSession.session_number == "TS-1045", 0),
            (TestSession.status == "APPROVED", 1),
            (TestSession.status == "UNDER_REVIEW", 2),
            (TestSession.status == "SUBMITTED", 3),
            (TestSession.status == "READY", 4),
            (TestSession.status == "IN_PROGRESS", 5),
            (TestSession.status == "DRAFT", 6),
            else_=7
        ),
        TestSession.created_at.desc()
    ).all()
    return {"items": items, "total": len(items)}

@router.post("/", response_model=TestSessionResponse)
def create_session(session_in: TestSessionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    session_num = f"TS-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    session = TestSession(
        **session_in.model_dump(),
        session_number=session_num,
        operator_id=current_user.id,
        started_at=datetime.utcnow(),
        status="DRAFT",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    log_action(db, current_user.id, current_user.email, current_user.role, "CREATE", "TestSession", session.id)
    return _session_query(db).filter(TestSession.id == session.id).first()

@router.get("/{id}", response_model=TestSessionResponse)
def get_session(id: int, db: Session = Depends(get_db)):
    session = _session_query(db).filter(TestSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.put("/{id}/status")
def update_status(id: int, status_update: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    session = _session_query(db).filter(TestSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    new_status = status_update.get("status")
    if new_status:
        session.status = new_status
    db.commit()
    log_action(db, current_user.id, current_user.email, current_user.role, "UPDATE_STATUS", "TestSession", session.id, f"Changed to {new_status}")
    return _session_query(db).filter(TestSession.id == id).first()

@router.put("/{id}/environment")
def update_environment(id: int, env: EnvironmentalConditions, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    session = _session_query(db).filter(TestSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.env_temperature = env.env_temperature
    session.env_humidity = env.env_humidity
    session.env_atmospheric_pressure = env.env_atmospheric_pressure
    if session.status == "DRAFT":
        session.status = "READY"
    db.commit()
    log_action(db, current_user.id, current_user.email, current_user.role, "UPDATE_ENV", "TestSession", session.id)
    return _session_query(db).filter(TestSession.id == id).first()

@router.post("/{id}/testguard")
def testguard_action(id: int, payload: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Advisory-only TestGuard actions. Never changes official PASS/FAIL."""
    session = db.query(TestSession).filter(TestSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    action = (payload.get("action") or "").upper()
    note = payload.get("notes") or ""
    stamp = datetime.utcnow().isoformat()
    existing = session.env_notes or ""
    if action == "FLAG":
        marker = f"[TESTGUARD REVIEW RECOMMENDED @ {stamp}] {note}".strip()
        session.env_notes = (existing + "\n" + marker).strip()
        reviewers = db.query(User).filter(User.role.in_(["REVIEWER", "APPROVER", "ADMINISTRATOR"])).all()
        for reviewer in reviewers:
            db.add(Notification(
                user_id=reviewer.id,
                title="TestGuard: REVIEW RECOMMENDED",
                message=f"Session {session.session_number} flagged by {current_user.full_name}. Advisory only — not an official result.",
                link=f"/testguard/{session.id}",
            ))
        log_action(db, current_user.id, current_user.email, current_user.role, "TESTGUARD_FLAG", "TestSession", session.id, "REVIEW RECOMMENDED")
        status = "REVIEW RECOMMENDED"
    elif action == "DISMISS":
        marker = f"[TESTGUARD DISMISSED @ {stamp}] {note}".strip()
        session.env_notes = (existing + "\n" + marker).strip()
        log_action(db, current_user.id, current_user.email, current_user.role, "TESTGUARD_DISMISS", "TestSession", session.id)
        status = "DISMISSED"
    else:
        raise HTTPException(status_code=400, detail="Invalid TestGuard action")
    db.commit()
    return {
        "status": status,
        "advisory": True,
        "official_result_unchanged": True,
        "label": "REVIEW RECOMMENDED" if action == "FLAG" else "DISMISSED",
        "notes": session.env_notes,
    }
