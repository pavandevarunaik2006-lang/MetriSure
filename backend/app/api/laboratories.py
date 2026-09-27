"""
MetriSure — API: Laboratories Management
Read access for authenticated users; create and update restricted to ADMINISTRATOR.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.core.database import get_db
from app.core.security import require_role
from app.models.laboratory import Laboratory
from app.models.user import User
from app.services.audit import log_action

router = APIRouter(prefix="/api/laboratories", tags=["laboratories"])

ALLOWED_FIELDS = {
    "name", "code", "address", "city", "state", "country",
    "accreditation_number", "accreditation_valid_until",
    "contact_person", "contact_email", "contact_phone", "is_active"
}


def _serialize_lab(lab: Laboratory) -> dict:
    return {
        "id": lab.id,
        "name": lab.name,
        "code": lab.code,
        "address": lab.address,
        "city": lab.city,
        "state": lab.state,
        "country": lab.country,
        "accreditation_number": lab.accreditation_number,
        "accreditation_valid_until": str(lab.accreditation_valid_until) if lab.accreditation_valid_until else None,
        "contact_person": lab.contact_person,
        "contact_email": lab.contact_email,
        "contact_phone": lab.contact_phone,
        "is_active": lab.is_active,
        "created_at": lab.created_at.isoformat() if lab.created_at else None,
        "updated_at": lab.updated_at.isoformat() if lab.updated_at else None,
    }


@router.get("/")
def list_laboratories(db: Session = Depends(get_db)):
    labs = db.query(Laboratory).all()
    return [_serialize_lab(l) for l in labs]


@router.post("/")
def create_laboratory(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMINISTRATOR"])),
):
    name = data.get("name", "").strip() if data.get("name") else ""
    code = data.get("code", "").strip() if data.get("code") else ""

    if not name or not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Laboratory name and code are required",
        )

    existing = db.query(Laboratory).filter(Laboratory.code == code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Laboratory with code '{code}' already exists",
        )

    clean_data = {k: v for k, v in data.items() if k in ALLOWED_FIELDS}
    lab = Laboratory(**clean_data)
    db.add(lab)
    db.commit()
    db.refresh(lab)

    log_action(
        db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="LABORATORY_CREATED",
        entity_type="Laboratory",
        entity_id=lab.id,
        details={"name": lab.name, "code": lab.code},
    )

    return _serialize_lab(lab)


@router.get("/{id}")
def get_laboratory(id: int, db: Session = Depends(get_db)):
    lab = db.query(Laboratory).filter(Laboratory.id == id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Laboratory not found")
    return _serialize_lab(lab)


@router.put("/{id}")
def update_laboratory(
    id: int,
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMINISTRATOR"])),
):
    lab = db.query(Laboratory).filter(Laboratory.id == id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Laboratory not found")

    if "code" in data and data["code"]:
        code = str(data["code"]).strip()
        if code != lab.code:
            existing = db.query(Laboratory).filter(Laboratory.code == code, Laboratory.id != id).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Laboratory with code '{code}' already exists",
                )
            lab.code = code

    if "name" in data and data["name"]:
        name = str(data["name"]).strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Laboratory name cannot be empty",
            )
        lab.name = name

    for k, v in data.items():
        if k in ALLOWED_FIELDS and k not in ("id", "code", "name"):
            setattr(lab, k, v)

    db.commit()
    db.refresh(lab)

    log_action(
        db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="LABORATORY_UPDATED",
        entity_type="Laboratory",
        entity_id=lab.id,
        details={"name": lab.name, "code": lab.code, "is_active": lab.is_active},
    )

    return _serialize_lab(lab)
