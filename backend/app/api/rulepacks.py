from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.evidence import RuleVersion
from app.models.test_session import TestSession
from app.models.test_case import TestCase
from app.rulepacks.demo_rulepack import DEMO_RULEPACK_CLASS_III

router = APIRouter(prefix="/api/rulepacks", tags=["rulepacks"])

def _pack_from_row(row: RuleVersion):
    params = row.parameters or DEMO_RULEPACK_CLASS_III.get("parameters", {})
    clauses = DEMO_RULEPACK_CLASS_III.get("clauses", [])
    if row.parameters and isinstance(row.parameters, dict) and "clauses" in row.parameters:
        clauses = row.parameters["clauses"]

    return {
        "id": row.id,
        "rulePackId": f"DEMO-{row.pack_version}",
        "pack_version": row.pack_version,
        "name": row.name,
        "description": row.description,
        "accuracy_class": row.accuracy_class or "III",
        "status": row.status,
        "is_demo": row.is_demo if row.is_demo is not None else True,
        "effective_date": row.effective_date.isoformat() if row.effective_date else "2026-09-01",
        "created_at": row.created_at.strftime("%Y-%m-%d") if hasattr(row, "created_at") and row.created_at else "2026-09-01",
        "disclaimer": "DEMO RULEPACK — NOT AUTHORITATIVE",
        "standard": row.standard or "OIML R-76-1:2006",
        "standard_version": row.standard_version or "2006",
        "clauses": clauses,
        "parameters": params,
    }

@router.get("/")
def list_rulepacks(db: Session = Depends(get_db)):
    rows = db.query(RuleVersion).order_by(RuleVersion.id.asc()).all()
    has_draft = any(r.pack_version == "1.0.1-rc1" for r in rows)
    if not has_draft:
        draft = RuleVersion(
            pack_version="1.0.1-rc1",
            name="DEMO RULEPACK — Class III NAWI (Candidate Update)",
            description="DEMO RULEPACK — NOT AUTHORITATIVE. Candidate revision with refined temperature boundary verification and modernized tare tolerance rules.",
            accuracy_class="III",
            status="DRAFT",
            is_demo=True,
            parameters={
                **DEMO_RULEPACK_CLASS_III["parameters"],
                "environmental_envelope": {
                    "temperature_min_c": 18.0,
                    "temperature_max_c": 24.0,
                    "humidity_max_percent": 80.0
                }
            }
        )
        db.add(draft)
        db.commit()
        rows = db.query(RuleVersion).order_by(RuleVersion.id.asc()).all()

    items = [_pack_from_row(r) for r in rows]
    if not items:
        items = [{**DEMO_RULEPACK_CLASS_III, "id": "demo", "disclaimer": "DEMO RULEPACK — NOT AUTHORITATIVE"}]
    return {"items": items, "total": len(items)}

@router.get("/change-impact")
def change_impact(from_version: str = "1.0.0", to_version: str = "1.0.0", db: Session = Depends(get_db)):
    sessions = db.query(TestSession).all()
    affected = []
    for session in sessions:
        fails = db.query(TestCase).filter(TestCase.session_id == session.id, TestCase.overall_result == "FAIL").count()
        current = "FAIL" if fails else ("PASS" if session.status in ("COMPLETED", "APPROVED") else session.status)
        simulated = current
        variance_reason = ""
        
        if from_version != to_version and session.rulepack_version == from_version:
            if to_version in ("1.0.1-rc1", "1.0.1"):
                temp = session.env_temperature
                if temp is not None and (temp < 18.0 or temp > 24.0):
                    simulated = "FAIL"
                    variance_reason = f"Recorded ambient temperature ({temp} °C) exceeds candidate envelope (18.0 - 24.0 °C)"
                elif fails > 0:
                    simulated = "FAIL"
                    variance_reason = f"Maintains failure under candidate MPE rules ({fails} test cases failed)"
                else:
                    simulated = "PASS"
                    
        if current != simulated:
            affected.append({
                "session_id": session.id,
                "session_number": session.session_number,
                "instrument_id": session.instrument_id,
                "from_result": current,
                "to_result": simulated,
                "reason": variance_reason or "Tolerance threshold variance under candidate RulePack.",
            })
            
    total = len(sessions)
    unchanged = total - len(affected)
    match_rate = round(((unchanged / total) * 100), 1) if total else 100.0
    return {
        "from_version": from_version,
        "to_version": to_version,
        "total_sessions": total,
        "unchanged": unchanged,
        "affected": affected,
        "match_rate": match_rate,
        "disclaimer": "SIMULATION — NOT AN OFFICIAL RESULT. DEMO RULEPACK — NOT AUTHORITATIVE",
    }

@router.get("/{id}")
def get_rulepack(id: str, db: Session = Depends(get_db)):
    row = None
    if str(id).isdigit():
        row = db.query(RuleVersion).filter(RuleVersion.id == int(id)).first()
    if not row:
        row = db.query(RuleVersion).filter(RuleVersion.pack_version == str(id)).first()
    if row:
        return _pack_from_row(row)
    if id in ("demo", DEMO_RULEPACK_CLASS_III.get("rulePackId"), "1.0.0"):
        return {
            **DEMO_RULEPACK_CLASS_III,
            "id": 1,
            "pack_version": "1.0.0",
            "status": "APPROVED",
            "disclaimer": "DEMO RULEPACK — NOT AUTHORITATIVE",
        }
    if id in ("1.0.1-rc1", "1.0.1"):
        return {
            **DEMO_RULEPACK_CLASS_III,
            "id": 2,
            "pack_version": id,
            "name": "DEMO RULEPACK — Class III NAWI (Candidate Update)",
            "status": "DRAFT",
            "disclaimer": "DEMO RULEPACK — NOT AUTHORITATIVE",
        }
    raise HTTPException(status_code=404, detail="RulePack not found")
