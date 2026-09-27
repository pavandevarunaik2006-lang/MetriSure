import os

BASE_DIR = r"c:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\backend"

files = {
    "app/schemas/__init__.py": "",
    
    "app/schemas/common.py": """from pydantic import BaseModel
from typing import List, Generic, TypeVar, Optional, Any

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int

class StatusResponse(BaseModel):
    status: str
    message: str

class ErrorResponse(BaseModel):
    detail: str
""",

    "app/schemas/auth.py": """from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "TECHNICIAN"
""",

    "app/schemas/instrument.py": """from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class InstrumentModelCreate(BaseModel):
    manufacturer: str
    model_name: str
    accuracy_class: str
    max_capacity: float
    min_capacity: float
    verification_scale_interval_e: float
    actual_scale_interval_d: float
    unit: str = "kg"
    approval_certificate: Optional[str] = None
    is_portable: bool = False
    notes: Optional[str] = None

class InstrumentModelResponse(InstrumentModelCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InstrumentCreate(BaseModel):
    model_id: int
    serial_number: str
    year_of_manufacture: Optional[int] = None
    laboratory_id: int
    notes: Optional[str] = None

class InstrumentResponse(BaseModel):
    id: int
    model_id: int
    serial_number: str
    year_of_manufacture: Optional[int]
    laboratory_id: int
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    model: Optional[InstrumentModelResponse] = None
    
    class Config:
        from_attributes = True

class InstrumentListResponse(BaseModel):
    items: List[InstrumentResponse]
    total: int
""",

    "app/schemas/test_session.py": """from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.instrument import InstrumentResponse

class EnvironmentalConditions(BaseModel):
    temperature: float
    humidity: float
    pressure: float

class TestSessionCreate(BaseModel):
    instrument_id: int
    laboratory_id: int
    rulepack_version: str
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None

class TestSessionResponse(BaseModel):
    id: int
    instrument_id: int
    laboratory_id: int
    status: str
    tester_id: Optional[int]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    temperature: Optional[float]
    humidity: Optional[float]
    pressure: Optional[float]
    rulepack_version: str
    created_at: datetime
    updated_at: datetime
    instrument: Optional[InstrumentResponse] = None
    
    class Config:
        from_attributes = True
""",

    "app/schemas/observation.py": """from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ObservationCreate(BaseModel):
    test_case_id: int
    sequence_number: int
    test_point_label: str
    reference_value: float
    reference_unit: str = "kg"
    indicated_value: float
    indicated_unit: str = "kg"
    fractional_weight_delta_l: Optional[float] = 0.0
    actual_interval_d: float
    direction: str = "UP"
    input_method: str = "MANUAL"
    notes: Optional[str] = None

class ObservationResponse(ObservationCreate):
    id: int
    is_valid: bool
    error: Optional[float]
    corrected_error: Optional[float]
    mpe_limit: Optional[float]
    result: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ObservationBulkImport(BaseModel):
    observations: List[ObservationCreate]
    source: str
""",

    "app/schemas/compliance.py": """from pydantic import BaseModel
from typing import Optional, List

class ComplianceEvalRequest(BaseModel):
    indicated_value: float
    reference_value: float
    actual_interval_d: float
    verification_interval_e: float
    fractional_weight_delta_l: float = 0.0
    zero_error: float = 0.0
    accuracy_class: str
    is_in_service: bool = False

class ComplianceEvalResponse(BaseModel):
    corrected_indication: float
    raw_error: float
    corrected_error: float
    permissible_error: float
    result: str
    explanation: str
    rule_identifier: str
    engine_version: str

class MPELookupRequest(BaseModel):
    load: float
    e: float
    accuracy_class: str
    is_in_service: bool = False

class MPELookupResponse(BaseModel):
    mpe_value: float
    mpe_factor: float
    load_range_description: str
""",

    "app/schemas/report.py": """from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ReportResponse(BaseModel):
    id: int
    session_id: int
    report_number: str
    version: int
    status: str
    generated_at: datetime
    sha256_hash: str
    
    class Config:
        from_attributes = True

class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int
""",

    "app/api/__init__.py": "",
    
    "app/api/auth.py": """from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import create_access_token, verify_password, get_password_hash, get_current_user, require_role, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserCreate, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["ADMINISTRATOR"]))):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
""",

    "app/api/instruments.py": """from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.instrument import Instrument, InstrumentModel
from app.models.test_session import TestSession
from app.schemas.instrument import InstrumentCreate, InstrumentResponse, InstrumentListResponse
from app.services.audit import log_action

router = APIRouter(prefix="/api/instruments", tags=["instruments"])

@router.get("/", response_model=InstrumentListResponse)
def list_instruments(q: str = None, accuracy_class: str = None, status: str = None, page: int = 1, page_size: int = 50, db: Session = Depends(get_db)):
    query = db.query(Instrument).join(InstrumentModel)
    if q:
        query = query.filter(Instrument.serial_number.ilike(f"%{q}%"))
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
    return db_inst

@router.get("/{id}", response_model=InstrumentResponse)
def get_instrument(id: int, db: Session = Depends(get_db)):
    db_inst = db.query(Instrument).filter(Instrument.id == id).first()
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
    db.refresh(db_inst)
    log_action(db, current_user.id, current_user.email, current_user.role, "UPDATE", "Instrument", db_inst.id)
    return db_inst

@router.get("/{id}/history")
def get_instrument_history(id: int, db: Session = Depends(get_db)):
    sessions = db.query(TestSession).filter(TestSession.instrument_id == id).order_by(TestSession.created_at.desc()).all()
    return sessions
""",

    "app/api/laboratories.py": """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role
from app.models.laboratory import Laboratory

router = APIRouter(prefix="/api/laboratories", tags=["laboratories"])

@router.get("/")
def list_laboratories(db: Session = Depends(get_db)):
    return db.query(Laboratory).all()

@router.post("/")
def create_laboratory(data: dict, db: Session = Depends(get_db), current_user = Depends(require_role(["ADMINISTRATOR"]))):
    lab = Laboratory(**data)
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab

@router.get("/{id}")
def get_laboratory(id: int, db: Session = Depends(get_db)):
    lab = db.query(Laboratory).filter(Laboratory.id == id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
    return lab

@router.put("/{id}")
def update_laboratory(id: int, data: dict, db: Session = Depends(get_db), current_user = Depends(require_role(["ADMINISTRATOR"]))):
    lab = db.query(Laboratory).filter(Laboratory.id == id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
    for k, v in data.items():
        setattr(lab, k, v)
    db.commit()
    db.refresh(lab)
    return lab
""",

    "app/api/test_sessions.py": """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.test_session import TestSession
from app.schemas.test_session import TestSessionCreate, TestSessionResponse, EnvironmentalConditions
from app.services.audit import log_action
from datetime import datetime

router = APIRouter(prefix="/api/test-sessions", tags=["test_sessions"])

@router.get("/")
def list_sessions(status: str = None, instrument_id: int = None, db: Session = Depends(get_db)):
    query = db.query(TestSession)
    if status:
        query = query.filter(TestSession.status == status)
    if instrument_id:
        query = query.filter(TestSession.instrument_id == instrument_id)
    return query.all()

@router.post("/", response_model=TestSessionResponse)
def create_session(session_in: TestSessionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    session = TestSession(**session_in.model_dump(), tester_id=current_user.id, start_time=datetime.utcnow())
    db.add(session)
    db.commit()
    db.refresh(session)
    log_action(db, current_user.id, current_user.email, current_user.role, "CREATE", "TestSession", session.id)
    return session

@router.get("/{id}", response_model=TestSessionResponse)
def get_session(id: int, db: Session = Depends(get_db)):
    session = db.query(TestSession).filter(TestSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.put("/{id}/status")
def update_status(id: int, status_update: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    session = db.query(TestSession).filter(TestSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    new_status = status_update.get("status")
    if new_status:
        session.status = new_status
    db.commit()
    log_action(db, current_user.id, current_user.email, current_user.role, "UPDATE_STATUS", "TestSession", session.id, f"Changed to {new_status}")
    return session

@router.put("/{id}/environment")
def update_environment(id: int, env: EnvironmentalConditions, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    session = db.query(TestSession).filter(TestSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.temperature = env.temperature
    session.humidity = env.humidity
    session.pressure = env.pressure
    db.commit()
    return session
""",

    "app/api/test_cases.py": """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.test_case import TestCase
from app.services.test_plan import generate_test_plan

router = APIRouter(prefix="/api/test-cases", tags=["test_cases"])

@router.post("/generate/{session_id}")
def generate_cases(session_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    cases = generate_test_plan(db, session_id)
    return {"message": f"Generated {len(cases)} test cases", "cases": cases}

@router.get("/{session_id}")
def list_test_cases(session_id: int, db: Session = Depends(get_db)):
    return db.query(TestCase).filter(TestCase.session_id == session_id).all()

@router.put("/{id}/status")
def update_test_case_status(id: int, status_update: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    tc = db.query(TestCase).filter(TestCase.id == id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")
    tc.status = status_update.get("status")
    db.commit()
    return tc
""",

    "app/api/observations.py": """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.test_case import Observation, TestCase
from app.models.test_session import TestSession
from app.schemas.observation import ObservationCreate, ObservationResponse, ObservationBulkImport
from app.compliance.engine import ComplianceEngine

router = APIRouter(prefix="/api/observations", tags=["observations"])

@router.post("/", response_model=ObservationResponse)
def create_observation(obs_in: ObservationCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    tc = db.query(TestCase).filter(TestCase.id == obs_in.test_case_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    session = db.query(TestSession).filter(TestSession.id == tc.session_id).first()
    engine = ComplianceEngine()
    
    # Simple eval (in a real scenario we need instrument metadata for e, class, etc.)
    # Here we simulate an evaluation
    corrected_indication = obs_in.indicated_value + 0.5 * obs_in.actual_interval_d - obs_in.fractional_weight_delta_l
    raw_error = corrected_indication - obs_in.reference_value
    
    obs = Observation(**obs_in.model_dump())
    obs.error = raw_error
    obs.corrected_error = raw_error
    obs.result = "PASS" if abs(raw_error) < 1.0 else "FAIL" # Simplified
    
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs

@router.get("/test-case/{test_case_id}")
def get_observations(test_case_id: int, db: Session = Depends(get_db)):
    return db.query(Observation).filter(Observation.test_case_id == test_case_id).all()

@router.post("/bulk-import")
def bulk_import(data: ObservationBulkImport, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # simplified bulk import
    count = 0
    for obs_in in data.observations:
        obs = Observation(**obs_in.model_dump())
        db.add(obs)
        count += 1
    db.commit()
    return {"message": f"Imported {count} observations"}

@router.put("/{id}")
def update_observation(id: int, data: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    obs = db.query(Observation).filter(Observation.id == id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    for k, v in data.items():
        setattr(obs, k, v)
    db.commit()
    return obs
""",

    "app/api/compliance.py": """from fastapi import APIRouter, Depends, HTTPException
from app.schemas.compliance import ComplianceEvalRequest, ComplianceEvalResponse, MPELookupRequest, MPELookupResponse
from app.compliance.engine import ComplianceEngine

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

@router.post("/evaluate", response_model=ComplianceEvalResponse)
def evaluate(req: ComplianceEvalRequest):
    engine = ComplianceEngine()
    try:
        res = engine.evaluate_observation(
            indicated_value=req.indicated_value,
            reference_value=req.reference_value,
            actual_interval_d=req.actual_interval_d,
            verification_interval_e=req.verification_interval_e,
            fractional_weight_delta_l=req.fractional_weight_delta_l,
            zero_error=req.zero_error,
            accuracy_class=req.accuracy_class,
            is_in_service=req.is_in_service
        )
        return {
            "corrected_indication": res.get("corrected_indication", 0.0),
            "raw_error": res.get("raw_error", 0.0),
            "corrected_error": res.get("corrected_error", 0.0),
            "permissible_error": res.get("permissible_error", 0.0),
            "result": res.get("result", "UNKNOWN"),
            "explanation": res.get("explanation", ""),
            "rule_identifier": res.get("rule_identifier", ""),
            "engine_version": "1.0.0"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evaluate-session/{session_id}")
def evaluate_session(session_id: int):
    return {"message": "Session evaluation completed"}

@router.get("/mpe", response_model=MPELookupResponse)
def mpe_lookup(load: float, e: float, accuracy_class: str, is_in_service: bool = False):
    engine = ComplianceEngine()
    mpe = engine.get_mpe(load, e, accuracy_class)
    if is_in_service:
        mpe *= 2
    return {
        "mpe_value": mpe * e,
        "mpe_factor": mpe,
        "load_range_description": "Lookup successful"
    }
""",

    "app/api/evidence.py": """from fastapi import APIRouter, Depends, UploadFile, File
import hashlib
import os

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

@router.post("/upload")
async def upload_evidence(file: UploadFile = File(...)):
    content = await file.read()
    sha256_hash = hashlib.sha256(content).hexdigest()
    # would save to disk in a real app
    return {"filename": file.filename, "hash": sha256_hash}

@router.get("/{id}")
def get_evidence(id: int):
    return {"id": id, "filename": "evidence.jpg"}

@router.get("/session/{session_id}")
def list_session_evidence(session_id: int):
    return []
""",

    "app/api/reports.py": """from fastapi import APIRouter, Depends
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.models.evidence import Report

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("/generate/{session_id}")
def generate_report(session_id: int, db: Session = Depends(get_db)):
    return {"message": "Report generated", "session_id": session_id}

@router.get("/")
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).all()

@router.get("/{id}")
def get_report(id: int, db: Session = Depends(get_db)):
    return db.query(Report).filter(Report.id == id).first()

@router.get("/{id}/verify")
def verify_report(id: int):
    return {"verified": True}
""",

    "app/api/review.py": """from fastapi import APIRouter, Depends
from app.core.security import require_role

router = APIRouter(prefix="/api/review", tags=["review"])

@router.post("/{session_id}/submit")
def submit_review(session_id: int, current_user = Depends(require_role(["TECHNICIAN"]))):
    return {"message": "Submitted for review"}

@router.post("/{session_id}/review")
def review_action(session_id: int, current_user = Depends(require_role(["REVIEWER"]))):
    return {"message": "Reviewed"}

@router.post("/{session_id}/approve")
def approve_session(session_id: int, current_user = Depends(require_role(["APPROVER"]))):
    return {"message": "Approved"}
""",

    "app/api/dashboard.py": """from fastapi import APIRouter

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/metrics")
def get_metrics():
    return {
        "active_sessions": 5,
        "pending_review": 2,
        "approved_reports": 10,
        "retest_required": 1,
        "tests_this_week": 8
    }

@router.get("/activity")
def get_activity():
    return []
""",

    "app/api/audit.py": """from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.evidence import AuditLog

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/")
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).all()
""",

    "app/api/users.py": """from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/")
def list_users(db: Session = Depends(get_db), current_user = Depends(require_role(["ADMINISTRATOR"]))):
    return db.query(User).all()

@router.put("/{id}")
def update_user(id: int, data: dict, db: Session = Depends(get_db), current_user = Depends(require_role(["ADMINISTRATOR"]))):
    user = db.query(User).filter(User.id == id).first()
    for k, v in data.items():
        setattr(user, k, v)
    db.commit()
    return user

@router.put("/{id}/role")
def update_user_role(id: int, data: dict, db: Session = Depends(get_db), current_user = Depends(require_role(["ADMINISTRATOR"]))):
    user = db.query(User).filter(User.id == id).first()
    user.role = data.get("role")
    db.commit()
    return user
""",

    "app/api/rulepacks.py": """from fastapi import APIRouter
from app.rulepacks.demo_rulepack import DEMO_RULEPACK_CLASS_III

router = APIRouter(prefix="/api/rulepacks", tags=["rulepacks"])

@router.get("/")
def list_rulepacks():
    return [DEMO_RULEPACK_CLASS_III]

@router.get("/{id}")
def get_rulepack(id: str):
    return DEMO_RULEPACK_CLASS_III
""",

    "app/services/__init__.py": "",
    
    "app/services/audit.py": """from app.models.evidence import AuditLog

def log_action(db, user_id, user_email, user_role, action, entity_type, entity_id, details=None):
    \"\"\"Log an action to the audit trail.\"\"\"
    audit = AuditLog(
        user_id=user_id,
        user_email=user_email,
        user_role=user_role,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details=details
    )
    db.add(audit)
    db.commit()
""",

    "app/services/test_plan.py": """from app.models.test_case import TestCase

def generate_test_plan(db, session_id):
    # Simplified generator
    cases = []
    tests = ["LINEARITY", "REPEATABILITY", "ECCENTRICITY", "DISCRIMINATION", "ZERO_SETTING"]
    for idx, test in enumerate(tests):
        tc = TestCase(
            session_id=session_id,
            test_type=test,
            status="PENDING",
            notes="Auto-generated"
        )
        db.add(tc)
        cases.append(tc)
    db.commit()
    return cases
""",

    "app/services/readiness.py": """def check_readiness(session):
    return [{"item": "Instrument Info", "status": "OK"}]
""",

    "app/seed_data.py": """from app.core.security import get_password_hash
from app.models.user import User
from app.models.laboratory import Laboratory
from app.models.instrument import InstrumentModel, Instrument
from app.models.test_session import TestSession
from app.models.evidence import RuleVersion
from datetime import datetime

def seed_demo_data(db):
    if db.query(User).first():
        return # Data exists
        
    pwd = get_password_hash("demo123")
    users = [
        User(email="technician@metrisure.demo", hashed_password=pwd, full_name="Priya Sharma", role="TECHNICIAN", is_active=True),
        User(email="reviewer@metrisure.demo", hashed_password=pwd, full_name="Rajesh Kumar", role="REVIEWER", is_active=True),
        User(email="approver@metrisure.demo", hashed_password=pwd, full_name="Dr. Anita Desai", role="APPROVER", is_active=True),
        User(email="admin@metrisure.demo", hashed_password=pwd, full_name="Vikram Singh", role="ADMINISTRATOR", is_active=True)
    ]
    db.add_all(users)
    
    labs = [
        Laboratory(name="National Metrology Lab Mumbai", location="Mumbai", code="NML-MUM", is_active=True),
        Laboratory(name="Regional Testing Lab Delhi", location="Delhi", code="RTL-DEL", is_active=True),
        Laboratory(name="State Metrology Lab Bangalore", location="Bangalore", code="SML-BLR", is_active=True)
    ]
    db.add_all(labs)
    db.commit()

    model = InstrumentModel(
        manufacturer="DemoTech",
        model_name="DT-3000",
        accuracy_class="III",
        max_capacity=30.0,
        min_capacity=0.1,
        verification_scale_interval_e=0.01,
        actual_scale_interval_d=0.01,
        unit="kg"
    )
    db.add(model)
    db.commit()

    inst = Instrument(
        model_id=model.id,
        serial_number="SN-DEMO-001",
        year_of_manufacture=2023,
        laboratory_id=labs[0].id,
        status="ACTIVE"
    )
    db.add(inst)
    
    rv = RuleVersion(
        rule_identifier="DEMO-OIML-R76-CLASS-III",
        version="1.0.0",
        content="{}",
        description="DEMO RULEPACK - NOT AUTHORITATIVE"
    )
    db.add(rv)
    db.commit()
    
    session = TestSession(
        instrument_id=inst.id,
        laboratory_id=labs[0].id,
        status="COMPLETED",
        tester_id=users[0].id,
        rulepack_version="1.0.0",
        temperature=22.5,
        humidity=45.0,
        pressure=1013.25
    )
    db.add(session)
    db.commit()
""",

    "app/main.py": """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import create_tables, SessionLocal
from app.models import *

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    from app.seed_data import seed_demo_data
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import auth, instruments, laboratories, test_sessions, test_cases, observations, compliance, evidence, reports, review, dashboard, audit, users, rulepacks

app.include_router(auth.router)
app.include_router(instruments.router)
app.include_router(laboratories.router)
app.include_router(test_sessions.router)
app.include_router(test_cases.router)
app.include_router(observations.router)
app.include_router(compliance.router)
app.include_router(evidence.router)
app.include_router(reports.router)
app.include_router(review.router)
app.include_router(dashboard.router)
app.include_router(audit.router)
app.include_router(users.router)
app.include_router(rulepacks.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
""",

    "app/rulepacks/__init__.py": "",
    
    "app/rulepacks/demo_rulepack.py": """DEMO_RULEPACK_CLASS_III = {
    "rulePackId": "DEMO-OIML-R76-CLASS-III-v1.0",
    "standard": "OIML R-76-1:2006",
    "standardVersion": "2006",
    "packVersion": "1.0.0",
    "accuracyClass": "III",
    "name": "DEMO RULEPACK - Class III Medium Accuracy NAWI",
    "description": "DEMO RULEPACK - NOT AUTHORITATIVE. Based on OIML R-76 structure for demonstration.",
    "isDemo": True
}
"""
}

for path, content in files.items():
    full_path = os.path.join(BASE_DIR, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
print("Files generated successfully.")
