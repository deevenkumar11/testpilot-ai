from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict

class HistoryItemResponse(BaseModel):
    id: int
    test_case_id: Optional[int] = None
    test_case_name: Optional[str] = None
    method: str
    url: str
    status_code: Optional[int] = None
    response_time_ms: float
    outcome: str
    request_headers: Optional[Dict[str, str]] = None
    request_params: Optional[Dict[str, str]] = None
    request_body: Optional[str] = None
    response_headers: Optional[Dict[str, str]] = None
    response_body: Optional[str] = None
    error_message: Optional[str] = None
    assertions_result: Optional[List[Dict[str, Any]]] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HistoryListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[HistoryItemResponse]
