"""
MetriSure — API: System Settings
Provides endpoints to fetch and update application-wide system configuration.
Admin-only write access with audit trail.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import require_role, get_current_user
from app.models.setting import SystemSetting
from app.models.user import User
from app.services.audit import log_action

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "org_name": {"value": "National Metrology Institute", "category": "general", "description": "Organization Name"},
    "timezone": {"value": "UTC (Coordinated Universal Time)", "category": "general", "description": "Default Timezone"},
    "environment": {"value": "Production", "category": "general", "description": "System Environment"},
    "require_mfa_approvers": {"value": "true", "category": "security", "description": "Require MFA for Approvers"},
    "enforce_password_rotation": {"value": "true", "category": "security", "description": "Enforce password rotation every 90 days"},
    "email_notifications": {"value": "true", "category": "notifications", "description": "Email Notifications Enabled"},
    "dashboard_alerts": {"value": "true", "category": "notifications", "description": "Dashboard Alerts Enabled"},
    "notification_email": {"value": "alerts@metrisure.demo", "category": "notifications", "description": "Alert Notification Email"},
}


def _ensure_default_settings(db: Session):
    for key, spec in DEFAULT_SETTINGS.items():
        existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not existing:
            setting = SystemSetting(
                key=key,
                value=spec["value"],
                category=spec["category"],
                description=spec["description"],
            )
            db.add(setting)
    db.commit()


@router.get("/")
@router.get("", include_in_schema=False)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieve all current system settings. Accessible to authenticated users."""
    _ensure_default_settings(db)
    rows = db.query(SystemSetting).all()
    result = {}
    for row in rows:
        val = row.value
        # Parse boolean-like strings
        if val.lower() == "true":
            parsed_val = True
        elif val.lower() == "false":
            parsed_val = False
        else:
            parsed_val = val
        result[row.key] = parsed_val
    return result


@router.put("/")
@router.put("", include_in_schema=False)
def update_settings(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMINISTRATOR"])),
) -> Dict[str, Any]:
    """Update system settings. Strictly restricted to ADMINISTRATOR."""
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload must be a key-value dictionary",
        )

    _ensure_default_settings(db)
    updated_keys = []

    for key, val in data.items():
        # Do not allow modifying environment from UI
        if key == "environment":
            continue

        str_val = str(val).lower() if isinstance(val, bool) else str(val)
        existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if existing:
            existing.value = str_val
        else:
            category = "general"
            if "mfa" in key or "password" in key or "security" in key:
                category = "security"
            elif "email" in key or "alert" in key or "notification" in key:
                category = "notifications"
            db.add(SystemSetting(key=key, value=str_val, category=category))
        updated_keys.append(key)

    db.commit()

    # Audit logging
    log_action(
        db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="SYSTEM_SETTING_UPDATED",
        entity_type="SystemSetting",
        entity_id="global",
        details={"updated_keys": updated_keys},
    )

    return get_settings(db=db, current_user=current_user)
