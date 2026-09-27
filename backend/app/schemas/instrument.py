from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class InstrumentModelCreate(BaseModel):
    manufacturer_name: str
    model_name: str
    accuracy_class: str
    max_capacity: float
    min_capacity: float
    verification_interval_e: float
    actual_interval_d: float
    unit: str = "kg"
    approval_certificate: Optional[str] = None
    is_portable: bool = False
    notes: Optional[str] = None

class InstrumentModelResponse(BaseModel):
    id: int
    manufacturer_name: str
    model_name: str
    accuracy_class: str
    max_capacity: float
    min_capacity: float
    verification_interval_e: float
    actual_interval_d: float
    unit: str = "kg"
    approval_certificate: Optional[str] = None
    is_portable: bool = False
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LaboratoryBrief(BaseModel):
    id: int
    name: str
    code: Optional[str] = None

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
    laboratory: Optional[LaboratoryBrief] = None
    
    class Config:
        from_attributes = True

class InstrumentListResponse(BaseModel):
    items: List[InstrumentResponse]
    total: int
