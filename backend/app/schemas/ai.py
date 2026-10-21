from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class AIAnalysisRequest(BaseModel):
    method: str = "GET"
    url: str
    status_code: Optional[int] = None
    response_time_ms: float = 0.0
    error_message: Optional[str] = None
    response_body: Optional[str] = None
    response_headers: Optional[Dict[str, str]] = None
    request_headers: Optional[Dict[str, str]] = None
    request_body: Optional[str] = None
    assertions_result: Optional[List[Dict[str, Any]]] = None

class AIAnalysisResponse(BaseModel):
    summary: str
    confirmed_facts: List[str]
    possible_causes: List[str]
    suggested_fixes: List[str]
    provider: str
    timestamp: str
