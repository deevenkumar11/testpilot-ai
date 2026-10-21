from fastapi import APIRouter
from app.core.config import settings
from app.schemas.settings import SettingsResponse, SettingsUpdateRequest

router = APIRouter(prefix="/settings", tags=["Settings & Safety"])

@router.get("", response_model=SettingsResponse)
def get_settings():
    """Retrieve current security and execution configurations."""
    return SettingsResponse(
        ssrf_protection_enabled=settings.SSRF_PROTECTION_ENABLED,
        default_timeout_seconds=settings.DEFAULT_TIMEOUT_SECONDS,
        max_timeout_seconds=settings.MAX_TIMEOUT_SECONDS,
        max_request_size_bytes=settings.MAX_REQUEST_SIZE_BYTES,
        max_response_size_bytes=settings.MAX_RESPONSE_SIZE_BYTES,
        ai_provider=settings.AI_PROVIDER,
        has_openai_key=bool(settings.OPENAI_API_KEY),
        has_gemini_key=bool(settings.GEMINI_API_KEY),
        ai_model=settings.AI_MODEL
    )

@router.put("", response_model=SettingsResponse)
def update_settings(update_in: SettingsUpdateRequest):
    """Update runtime configurations safely."""
    if update_in.ssrf_protection_enabled is not None:
        settings.SSRF_PROTECTION_ENABLED = update_in.ssrf_protection_enabled
    if update_in.default_timeout_seconds is not None:
        settings.DEFAULT_TIMEOUT_SECONDS = min(max(update_in.default_timeout_seconds, 1.0), settings.MAX_TIMEOUT_SECONDS)
    if update_in.ai_provider is not None:
        settings.AI_PROVIDER = update_in.ai_provider
    if update_in.openai_api_key is not None:
        settings.OPENAI_API_KEY = update_in.openai_api_key.strip()
    if update_in.gemini_api_key is not None:
        settings.GEMINI_API_KEY = update_in.gemini_api_key.strip()
    if update_in.ai_model is not None:
        settings.AI_MODEL = update_in.ai_model.strip()

    return get_settings()
