from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.history import ExecutionHistory
from app.schemas.requests import RequestExecution, RequestResponse
from app.services.http_client import execute_http_request
from app.services.assertion_evaluator import evaluate_assertions
from app.services.ai_service import analyze_api_failure

router = APIRouter()

@router.post("/requests/execute", response_model=RequestResponse, tags=["Requests"])
async def execute_request(req: RequestExecution, db: Session = Depends(get_db)):
    """
    Executes an HTTP request, evaluates assertions, triggers AI diagnostics if failed,
    and logs execution history.
    """
    # 1. Execute HTTP request
    http_result = await execute_http_request(
        method=req.method,
        url=req.url,
        headers=req.headers,
        params=req.params,
        body=req.body,
        timeout=req.timeout,
        verify_ssl=req.verify_ssl
    )

    # 2. Evaluate assertions
    assertions_result = []
    all_assertions_passed = True
    if req.assertions:
        assertions_result, all_assertions_passed = evaluate_assertions(
            assertions=req.assertions,
            status_code=http_result["status_code"],
            response_time_ms=http_result["response_time_ms"],
            headers=http_result["headers"],
            raw_body=http_result["body"],
            json_data=http_result["json_data"]
        )

    # 3. Determine final outcome
    if http_result["outcome"] == "ERROR":
        outcome = "ERROR"
    elif req.assertions and not all_assertions_passed:
        outcome = "FAIL"
    elif http_result["status_code"] is not None and http_result["status_code"] >= 400:
        outcome = "FAIL"
    else:
        outcome = "PASS"

    # 4. Trigger AI Diagnostics if request failed or had errors
    ai_analysis = None
    if outcome in ("FAIL", "ERROR"):
        ai_analysis = await analyze_api_failure(
            method=req.method,
            url=req.url,
            status_code=http_result["status_code"],
            response_time_ms=http_result["response_time_ms"],
            error_message=http_result["error_message"],
            response_body=http_result["body"],
            response_headers=http_result["headers"],
            request_headers=req.headers,
            request_body=req.body,
            assertions_result=[a.model_dump() for a in assertions_result] if assertions_result else None
        )

    # 5. Persist to history if enabled
    if req.save_to_history:
        history_entry = ExecutionHistory(
            test_case_id=req.test_case_id,
            test_case_name=req.test_case_name,
            method=req.method.upper(),
            url=req.url,
            status_code=http_result["status_code"],
            response_time_ms=http_result["response_time_ms"],
            outcome=outcome,
            request_headers=req.headers,
            request_params=req.params,
            request_body=req.body,
            response_headers=http_result["headers"],
            # Truncate response body stored in DB to 50KB to keep database performant
            response_body=http_result["body"][:50000] if http_result["body"] else None,
            error_message=http_result["error_message"],
            assertions_result=[a.model_dump() for a in assertions_result] if assertions_result else None,
            ai_analysis=ai_analysis
        )
        db.add(history_entry)
        db.commit()

    return RequestResponse(
        status_code=http_result["status_code"],
        response_time_ms=http_result["response_time_ms"],
        headers=http_result["headers"],
        body=http_result["body"],
        is_json=http_result["is_json"],
        json_data=http_result["json_data"],
        size_bytes=http_result["size_bytes"],
        outcome=outcome,
        error_message=http_result["error_message"],
        assertions_result=assertions_result,
        ai_analysis=ai_analysis
    )
