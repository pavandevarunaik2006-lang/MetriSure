from pydantic import BaseModel
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
