from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.test_session import TestSession
from app.models.evidence import Report, AuditLog

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    sessions = db.query(TestSession)
    return {
        "active_sessions": sessions.filter(TestSession.status.in_(["READY", "IN_PROGRESS", "DRAFT"])).count(),
        "pending_review": sessions.filter(TestSession.status.in_(["SUBMITTED", "UNDER_REVIEW", "REVIEWED"])).count(),
        "approved_reports": db.query(Report).filter(Report.status.in_(["ISSUED", "APPROVED"])).count(),
        "retest_required": sessions.filter(TestSession.status == "RETEST_REQUIRED").count(),
        "tests_this_week": sessions.count(),
    }

@router.get("/activity")
def get_activity(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(20).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "user_email": log.user_email,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]
