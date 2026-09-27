from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.instrument import InstrumentResponse, LaboratoryBrief

class EnvironmentalConditions(BaseModel):
    env_temperature: float
    env_humidity: float
    env_atmospheric_pressure: float

class TestSessionCreate(BaseModel):
    instrument_id: int
    laboratory_id: int
    rulepack_version: str
    env_temperature: Optional[float] = None
    env_humidity: Optional[float] = None
    env_atmospheric_pressure: Optional[float] = None

class TestSessionResponse(BaseModel):
    id: int
    session_number: str
    instrument_id: int
    laboratory_id: int
    status: str
    operator_id: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    env_temperature: Optional[float]
    env_humidity: Optional[float]
    env_atmospheric_pressure: Optional[float]
    rulepack_version: str
    created_at: datetime
    updated_at: Optional[datetime]
    instrument: Optional[InstrumentResponse] = None
    laboratory: Optional[LaboratoryBrief] = None
    
    class Config:
        from_attributes = True


class TestSessionListResponse(BaseModel):
    items: List[TestSessionResponse]
    total: int
