"""
MetriSure — API: Users Management
Administrator-only access for managing users, roles, and status.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.services.audit import log_action

router = APIRouter(prefix="/api/users", tags=["users"])

VALID_ROLES = {"ADMINISTRATOR", "REVIEWER", "APPROVER", "TECHNICIAN"}


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMINISTRATOR"])),
):
    users = db.query(User).all()
    return [_serialize_user(u) for u in users]


@router.get("/{id}")
def get_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMINISTRATOR"])),
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _serialize_user(user)


@router.put("/{id}")
def update_user(
    id: int,
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMINISTRATOR"])),
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    allowed_fields = {"full_name", "email", "role", "is_active"}
    updated_fields = {}

    if "role" in data:
        role = data["role"]
        if role not in VALID_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{role}'. Allowed roles: {list(VALID_ROLES)}",
            )
        user.role = role
        updated_fields["role"] = role

    if "full_name" in data:
        full_name = str(data["full_name"]).strip()
        if not full_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Full name cannot be empty",
            )
        user.full_name = full_name
        updated_fields["full_name"] = full_name

    if "email" in data:
        email = str(data["email"]).strip().lower()
        if not email or "@" not in email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Valid email address is required",
            )
        existing = db.query(User).filter(User.email == email, User.id != id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{email}' is already in use by another user",
            )
        user.email = email
        updated_fields["email"] = email

    if "is_active" in data:
        user.is_active = bool(data["is_active"])
        updated_fields["is_active"] = user.is_active

    db.commit()
    db.refresh(user)

    log_action(
        db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="USER_UPDATED",
        entity_type="User",
        entity_id=user.id,
        details={"updated_fields": updated_fields},
    )

    return _serialize_user(user)


@router.put("/{id}/role")
def update_user_role(
    id: int,
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMINISTRATOR"])),
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_role = data.get("role")
    if not new_role or new_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles: {list(VALID_ROLES)}",
        )

    user.role = new_role
    db.commit()
    db.refresh(user)

    log_action(
        db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="USER_ROLE_UPDATED",
        entity_type="User",
        entity_id=user.id,
        details={"new_role": new_role},
    )

    return _serialize_user(user)
