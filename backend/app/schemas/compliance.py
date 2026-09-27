from pydantic import BaseModel
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
