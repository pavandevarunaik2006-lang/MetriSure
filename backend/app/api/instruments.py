from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import require_role
from app.models.instrument import Instrument, InstrumentModel
from app.models.test_session import TestSession
from app.schemas.instrument import InstrumentCreate, InstrumentResponse, InstrumentListResponse
from app.services.audit import log_action

router = APIRouter(prefix="/api/instruments", tags=["instruments"])

def _instrument_query(db: Session):
    return db.query(Instrument).options(
        joinedload(Instrument.model),
        joinedload(Instrument.laboratory),
    )

@router.get("/", response_model=InstrumentListResponse)
def list_instruments(q: str = None, accuracy_class: str = None, status: str = None, page: int = 1, page_size: int = 50, db: Session = Depends(get_db)):
    query = _instrument_query(db).join(InstrumentModel)
    if q:
        query = query.filter(
            or_(
                Instrument.serial_number.ilike(f"%{q}%"),
                InstrumentModel.model_name.ilike(f"%{q}%"),
                InstrumentModel.manufacturer_name.ilike(f"%{q}%"),
            )
        )
    if accuracy_class:
        query = query.filter(InstrumentModel.accuracy_class == accuracy_class)
    if status:
        query = query.filter(Instrument.status == status)
        
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total}

@router.post("/", response_model=InstrumentResponse)
def create_instrument(instrument_in: InstrumentCreate, db: Session = Depends(get_db), current_user = Depends(require_role(["TECHNICIAN", "ADMINISTRATOR"]))):
    db_model = db.query(InstrumentModel).filter(InstrumentModel.id == instrument_in.model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    db_inst = Instrument(**instrument_in.model_dump())
    db.add(db_inst)
    db.commit()
    db.refresh(db_inst)
    
    log_action(db, current_user.id, current_user.email, current_user.role, "CREATE", "Instrument", db_inst.id)
    return _instrument_query(db).filter(Instrument.id == db_inst.id).first()

@router.get("/{id}", response_model=InstrumentResponse)
def get_instrument(id: int, db: Session = Depends(get_db)):
    db_inst = _instrument_query(db).filter(Instrument.id == id).first()
    if not db_inst:
        raise HTTPException(status_code=404, detail="Instrument not found")
    return db_inst

@router.put("/{id}", response_model=InstrumentResponse)
def update_instrument(id: int, instrument_in: InstrumentCreate, db: Session = Depends(get_db), current_user = Depends(require_role(["TECHNICIAN", "ADMINISTRATOR"]))):
    db_inst = db.query(Instrument).filter(Instrument.id == id).first()
    if not db_inst:
        raise HTTPException(status_code=404, detail="Instrument not found")
        
    for key, value in instrument_in.model_dump().items():
        setattr(db_inst, key, value)
        
    db.commit()
    log_action(db, current_user.id, current_user.email, current_user.role, "UPDATE", "Instrument", db_inst.id)
    return _instrument_query(db).filter(Instrument.id == db_inst.id).first()

@router.get("/{id}/history")
def get_instrument_history(id: int, db: Session = Depends(get_db)):
    sessions = db.query(TestSession).options(
        joinedload(TestSession.instrument).joinedload(Instrument.model),
        joinedload(TestSession.laboratory),
    ).filter(TestSession.instrument_id == id).order_by(TestSession.created_at.desc()).all()
    return sessions
