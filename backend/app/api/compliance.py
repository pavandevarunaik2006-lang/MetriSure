from fastapi import APIRouter, Depends, HTTPException
from app.schemas.compliance import ComplianceEvalRequest, ComplianceEvalResponse, MPELookupRequest, MPELookupResponse
from app.compliance.engine import ComplianceEngine

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

@router.post("/evaluate", response_model=ComplianceEvalResponse)
def evaluate(req: ComplianceEvalRequest):
    engine = ComplianceEngine()
    try:
        from app.compliance.engine import ObservationInput
        res = engine.evaluate_observation(ObservationInput(
            indicated_value=req.indicated_value,
            reference_value=req.reference_value,
            actual_interval_d=req.actual_interval_d,
            verification_interval_e=req.verification_interval_e,
            fractional_weight_delta_l=req.fractional_weight_delta_l,
            zero_error=req.zero_error,
            accuracy_class=req.accuracy_class,
            is_in_service=req.is_in_service
        ))
        return {
            "corrected_indication": res.corrected_indication,
            "raw_error": res.raw_error,
            "corrected_error": res.corrected_error,
            "permissible_error": res.permissible_error,
            "result": res.result,
            "explanation": res.explanation,
            "rule_identifier": res.rule_identifier,
            "engine_version": res.engine_version,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evaluate-session/{session_id}")
def evaluate_session(session_id: int):
    return {"message": "Session evaluation completed"}

@router.get("/mpe", response_model=MPELookupResponse)
def mpe_lookup(load: float, e: float, accuracy_class: str, is_in_service: bool = False):
    engine = ComplianceEngine()
    res = engine.get_mpe(load, e, accuracy_class, is_in_service=is_in_service)
    return {
        "mpe_value": res.mpe_value,
        "mpe_factor": res.mpe_factor,
        "load_range_description": res.load_range_description
    }
