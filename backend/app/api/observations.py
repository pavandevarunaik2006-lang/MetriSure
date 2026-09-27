from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.test_case import Observation, TestCase
from app.models.test_session import TestSession
from app.models.instrument import Instrument
from app.schemas.observation import ObservationCreate, ObservationResponse, ObservationBulkImport
from app.compliance.engine import ComplianceEngine, ObservationInput
from app.services.audit import log_action

router = APIRouter(prefix="/api/observations", tags=["observations"])

def _serialize_obs(obs: Observation):
    text = obs.notes
    return {
        "id": obs.id,
        "test_case_id": obs.test_case_id,
        "sequence_number": obs.sequence_number,
        "test_point_label": obs.test_point_label,
        "reference_value": obs.reference_value,
        "reference_unit": obs.reference_unit,
        "indicated_value": obs.indicated_value,
        "indicated_unit": obs.indicated_unit,
        "fractional_weight_delta_l": obs.fractional_weight_delta_l,
        "actual_interval_d": obs.actual_interval_d,
        "direction": obs.direction,
        "input_method": obs.input_method,
        "notes": obs.notes,
        "observation_text": text,
        "calculated_error": obs.calculated_error,
        "corrected_error": obs.corrected_error,
        "permissible_error": obs.permissible_error,
        "zero_error": obs.zero_error,
        "result": obs.result,
        "timestamp": obs.timestamp,
        "created_at": obs.created_at,
        "error": obs.corrected_error,
    }

@router.post("/", response_model=ObservationResponse)
def create_observation(obs_in: ObservationCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    tc = db.query(TestCase).filter(TestCase.id == obs_in.test_case_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    session = db.query(TestSession).options(
        joinedload(TestSession.instrument).joinedload(Instrument.model)
    ).filter(TestSession.id == tc.session_id).first()
    if not session or not session.instrument or not session.instrument.model:
        raise HTTPException(status_code=400, detail="Session instrument model is missing")

    model = session.instrument.model
    next_seq = db.query(Observation).filter(Observation.test_case_id == tc.id).count() + 1
    notes = obs_in.notes or obs_in.observation_text
    actual_d = obs_in.actual_interval_d if obs_in.actual_interval_d is not None else model.actual_interval_d
    indicated = obs_in.indicated_value
    reference = obs_in.reference_value

    # Qualitative note without measurement values — do not invent PASS/FAIL
    if indicated is None or reference is None:
        obs = Observation(
            test_case_id=tc.id,
            sequence_number=obs_in.sequence_number or next_seq,
            test_point_label=obs_in.test_point_label or "NOTE",
            reference_value=0.0,
            indicated_value=0.0,
            actual_interval_d=actual_d,
            direction=obs_in.direction or "INCREASING",
            input_method=obs_in.input_method or "MANUAL",
            notes=notes,
            operator_id=current_user.id,
            timestamp=obs_in.timestamp or datetime.utcnow(),
        )
        db.add(obs)
        if tc.status == "PENDING":
            tc.status = "IN_PROGRESS"
        db.commit()
        db.refresh(obs)
        log_action(db, current_user.id, current_user.email, current_user.role, "CREATE_NOTE", "Observation", obs.id)
        return obs

    obs_input = ObservationInput(
        indicated_value=indicated,
        reference_value=reference,
        actual_interval_d=actual_d,
        verification_interval_e=model.verification_interval_e,
        fractional_weight_delta_l=obs_in.fractional_weight_delta_l or 0.0,
        zero_error=0.0,
        accuracy_class=model.accuracy_class,
        is_in_service=False,
        test_type=tc.test_type,
        direction=obs_in.direction or "INCREASING",
        unit=getattr(model, "unit", None) or model.max_capacity_unit or "kg",
    )
    
    engine = ComplianceEngine()
    result = engine.evaluate_observation(obs_input)
    
    payload = obs_in.model_dump(exclude_unset=True)
    payload.pop("observation_text", None)
    payload.pop("timestamp", None)
    payload["sequence_number"] = obs_in.sequence_number or next_seq
    payload["test_point_label"] = obs_in.test_point_label or f"P{payload['sequence_number']}"
    payload["actual_interval_d"] = actual_d
    payload["indicated_value"] = indicated
    payload["reference_value"] = reference
    payload["notes"] = notes
    payload["direction"] = obs_in.direction or "INCREASING"

    obs = Observation(**payload)
    obs.calculated_error = result.raw_error
    obs.corrected_error = result.corrected_error
    obs.permissible_error = result.permissible_error
    obs.zero_error = result.zero_error
    obs.corrected_indication = result.corrected_indication
    obs.result = result.result
    obs.operator_id = current_user.id
    obs.timestamp = obs_in.timestamp or datetime.utcnow()
    
    db.add(obs)
    if tc.status == "PENDING":
        tc.status = "IN_PROGRESS"
    db.commit()
    db.refresh(obs)
    log_action(db, current_user.id, current_user.email, current_user.role, "CREATE", "Observation", obs.id, result.result)
    return obs

@router.get("/test-case/{test_case_id}")
def get_observations(test_case_id: int, db: Session = Depends(get_db)):
    items = db.query(Observation).filter(Observation.test_case_id == test_case_id).order_by(Observation.sequence_number).all()
    return [_serialize_obs(o) for o in items]

@router.post("/bulk-import")
def bulk_import(data: ObservationBulkImport, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    count = 0
    for obs_in in data.observations:
        create_observation(obs_in, db, current_user)
        count += 1
    return {"message": f"Imported {count} observations"}

@router.put("/{id}")
def update_observation(id: int, data: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    obs = db.query(Observation).filter(Observation.id == id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    for k, v in data.items():
        if k in ("result", "calculated_error", "corrected_error", "permissible_error"):
            continue
        setattr(obs, k, v)
    db.commit()
    return _serialize_obs(obs)

@router.get("/{id}")
def get_observation(id: int, db: Session = Depends(get_db)):
    obs = db.query(Observation).filter(Observation.id == id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    return _serialize_obs(obs)

@router.get("/session/{session_id}")
def get_session_observations(session_id: int, db: Session = Depends(get_db)):
    items = db.query(Observation).join(TestCase).filter(TestCase.session_id == session_id).order_by(Observation.id).all()
    return [_serialize_obs(o) for o in items]

