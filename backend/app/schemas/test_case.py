from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.requests import AssertionItem, RequestResponse

class TestCaseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    method: str = Field("GET", pattern="^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$")
    url: str = Field(..., min_length=1)
    headers: Dict[str, str] = Field(default_factory=dict)
    params: Dict[str, str] = Field(default_factory=dict)
    body: Optional[str] = None
    assertions: List[AssertionItem] = Field(default_factory=list)

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    params: Optional[Dict[str, str]] = None
    body: Optional[str] = None
    assertions: Optional[List[AssertionItem]] = None

class TestCaseResponse(TestCaseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BatchRunItemResult(BaseModel):
    test_case_id: int
    test_case_name: str
    result: RequestResponse

class BatchRunResponse(BaseModel):
    total: int
    passed: int
    failed: int
    errors: int
    total_time_ms: float
    items: List[BatchRunItemResult]
