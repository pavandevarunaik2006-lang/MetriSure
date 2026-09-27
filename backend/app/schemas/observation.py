from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ObservationCreate(BaseModel):
    test_case_id: int
    sequence_number: Optional[int] = None
    test_point_label: Optional[str] = None
    reference_value: Optional[float] = None
    reference_unit: str = "kg"
    indicated_value: Optional[float] = None
    indicated_unit: str = "kg"
    fractional_weight_delta_l: Optional[float] = 0.0
    actual_interval_d: Optional[float] = None
    direction: str = "INCREASING"
    input_method: str = "MANUAL"
    notes: Optional[str] = None
    observation_text: Optional[str] = None
    timestamp: Optional[datetime] = None

class ObservationResponse(ObservationCreate):
    id: int
    calculated_error: Optional[float]
    corrected_error: Optional[float]
    permissible_error: Optional[float]
    zero_error: Optional[float]
    result: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ObservationBulkImport(BaseModel):
    observations: List[ObservationCreate]
    source: str
