from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.evidence import AuditLog
from app.models.user import User

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/")
@router.get("", include_in_schema=False)
def get_audit_logs(
    entity_type: str = None,
    entity_id: str = None,
    action: str = None,
    user_role: str = None,
    user_email: str = None,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AuditLog)

    # RBAC: TECHNICIAN can only view their own audit events
    if current_user.role == "TECHNICIAN":
        query = query.filter(AuditLog.user_email == current_user.email)
    elif user_email:
        query = query.filter(AuditLog.user_email == user_email)

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == str(entity_id))
    if action and action != "ALL":
        query = query.filter(AuditLog.action == action)
    if user_role and user_role != "ALL":
        query = query.filter(AuditLog.user_role == user_role)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (AuditLog.user_email.ilike(s)) |
            (AuditLog.action.ilike(s)) |
            (AuditLog.entity_type.ilike(s)) |
            (AuditLog.entity_id.ilike(s))
        )

    logs = query.order_by(AuditLog.timestamp.desc()).limit(500).all()
    return {
        "items": [
            {
                "id": log.id,
                "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else None,
                "user_email": log.user_email,
                "user_role": log.user_role,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "details": log.details,
                "ip_address": log.ip_address or "127.0.0.1",
            }
            for log in logs
        ],
        "total": len(logs),
        "disclaimer": "DEMO DATA — FOR DEMONSTRATION ONLY",
    }
