from pydantic import BaseModel
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
