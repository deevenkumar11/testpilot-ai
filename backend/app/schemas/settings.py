from typing import Optional
from pydantic import BaseModel

class SettingsResponse(BaseModel):
    ssrf_protection_enabled: bool
    default_timeout_seconds: float
    max_timeout_seconds: float
    max_request_size_bytes: int
    max_response_size_bytes: int
    ai_provider: str
    has_openai_key: bool
    has_gemini_key: bool
    ai_model: str

class SettingsUpdateRequest(BaseModel):
    ssrf_protection_enabled: Optional[bool] = None
    default_timeout_seconds: Optional[float] = None
    ai_provider: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    ai_model: Optional[str] = None
