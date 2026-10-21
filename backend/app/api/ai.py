from fastapi import APIRouter
from app.schemas.ai import AIAnalysisRequest, AIAnalysisResponse
from app.services.ai_service import analyze_api_failure

router = APIRouter(prefix="/ai", tags=["AI Diagnostics"])

@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_error(payload: AIAnalysisRequest):
    """
    On-demand AI error diagnosis.
    Explains probable root causes and provides step-by-step troubleshooting suggestions.
    """
    result = await analyze_api_failure(
        method=payload.method,
        url=payload.url,
        status_code=payload.status_code,
        response_time_ms=payload.response_time_ms,
        error_message=payload.error_message,
        response_body=payload.response_body,
        response_headers=payload.response_headers,
        request_headers=payload.request_headers,
        request_body=payload.request_body,
        assertions_result=payload.assertions_result
    )

    return AIAnalysisResponse(
        summary=result["summary"],
        confirmed_facts=result["confirmed_facts"],
        possible_causes=result["possible_causes"],
        suggested_fixes=result["suggested_fixes"],
        provider=result["provider"],
        timestamp=result["timestamp"]
    )
