from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class AssertionItem(BaseModel):
    id: Optional[str] = None
    type: str = Field(..., description="Assertion type: status_code, response_time, json_field_exists, json_field_value, body_contains, header_exists")
    target: Optional[str] = Field(None, description="Path/key like 'data.id' or 'Content-Type'")
    operator: str = Field("equals", description="equals, not_equals, less_than, greater_than, contains, exists")
    expected: Any = Field(..., description="Expected value")

class AssertionResult(BaseModel):
    id: Optional[str] = None
    type: str
    target: Optional[str] = None
    operator: str
    expected: Any
    actual: Any = None
    passed: bool
    message: str

class RequestExecution(BaseModel):
    method: str = Field("GET", description="HTTP method: GET, POST, PUT, PATCH, DELETE")
    url: str = Field(..., description="Target URL")
    headers: Dict[str, str] = Field(default_factory=dict)
    params: Dict[str, str] = Field(default_factory=dict)
    body: Optional[str] = Field(None, description="Request body payload")
    assertions: List[AssertionItem] = Field(default_factory=list)
    timeout: float = Field(10.0, description="Request timeout in seconds")
    verify_ssl: bool = Field(True, description="Verify TLS certificate")
    save_to_history: bool = Field(True, description="Whether to record this execution in history")
    test_case_id: Optional[int] = None
    test_case_name: Optional[str] = None

class RequestResponse(BaseModel):
    status_code: Optional[int] = None
    response_time_ms: float = 0.0
    headers: Dict[str, str] = Field(default_factory=dict)
    body: Optional[str] = None
    is_json: bool = False
    json_data: Any = None
    size_bytes: int = 0
    outcome: str = "PASS"  # PASS, FAIL, ERROR
    error_message: Optional[str] = None
    assertions_result: List[AssertionResult] = Field(default_factory=list)
    ai_analysis: Optional[Dict[str, Any]] = None
