import time
import json
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urljoin
import httpx
from app.core.config import settings
from app.core.security import validate_url_ssrf, SSRFSecurityError

async def execute_http_request(
    method: str,
    url: str,
    headers: Optional[Dict[str, str]] = None,
    params: Optional[Dict[str, str]] = None,
    body: Optional[str] = None,
    timeout: float = 10.0,
    verify_ssl: bool = True,
    max_redirects: int = 5
) -> Dict[str, Any]:
    """
    Executes an HTTP request with SSRF protection, strict redirect inspection,
    latency measurement, and robust error handling.
    """
    method = method.upper().strip()
    headers = headers or {}
    params = params or {}
    
    # 1. Enforce timeout bounds
    safe_timeout = min(max(timeout, 0.5), settings.MAX_TIMEOUT_SECONDS)

    # 2. Pre-validate URL for SSRF
    try:
        validate_url_ssrf(url)
    except SSRFSecurityError as ssrf_err:
        return {
            "status_code": None,
            "response_time_ms": 0.0,
            "headers": {},
            "body": None,
            "is_json": False,
            "json_data": None,
            "size_bytes": 0,
            "outcome": "ERROR",
            "error_message": f"Security Policy Violation: {ssrf_err.message}"
        }
    except Exception as e:
        return {
            "status_code": None,
            "response_time_ms": 0.0,
            "headers": {},
            "body": None,
            "is_json": False,
            "json_data": None,
            "size_bytes": 0,
            "outcome": "ERROR",
            "error_message": f"Invalid Target URL: {str(e)}"
        }

    # 3. Prepare headers
    clean_headers = {k: str(v) for k, v in headers.items() if k and v is not None}
    
    # Auto-add Content-Type for JSON if body is provided and header not already set
    if body and "content-type" not in {k.lower(): v for k, v in clean_headers.items()}:
        try:
            json.loads(body)
            clean_headers["Content-Type"] = "application/json"
        except Exception:
            clean_headers["Content-Type"] = "text/plain"

    current_url = url
    redirect_count = 0
    start_time = time.perf_counter()

    # We manually handle redirects to validate each destination against SSRF!
    async with httpx.AsyncClient(verify=verify_ssl, follow_redirects=False) as client:
        while True:
            try:
                # Re-validate the destination (especially crucial for redirects)
                validate_url_ssrf(current_url)

                req_content = body.encode("utf-8") if body and redirect_count == 0 else None
                
                response = await client.request(
                    method=method if redirect_count == 0 else "GET",
                    url=current_url,
                    headers=clean_headers,
                    params=params if redirect_count == 0 else None,
                    content=req_content,
                    timeout=safe_timeout
                )

                # Check if this is a redirect
                if response.is_redirect and "location" in response.headers:
                    redirect_count += 1
                    if redirect_count > max_redirects:
                        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                        return {
                            "status_code": response.status_code,
                            "response_time_ms": round(elapsed_ms, 2),
                            "headers": dict(response.headers),
                            "body": "Maximum redirect limit exceeded (5)",
                            "is_json": False,
                            "json_data": None,
                            "size_bytes": 0,
                            "outcome": "ERROR",
                            "error_message": "Exceeded maximum redirect hops"
                        }
                    
                    next_url = response.headers["location"]
                    current_url = urljoin(current_url, next_url)
                    continue

                # Final response reached
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                
                # Check response payload size
                content_bytes = response.content
                if len(content_bytes) > settings.MAX_RESPONSE_SIZE_BYTES:
                    return {
                        "status_code": response.status_code,
                        "response_time_ms": round(elapsed_ms, 2),
                        "headers": dict(response.headers),
                        "body": f"Response size ({len(content_bytes)} bytes) exceeds the maximum allowed limit of {settings.MAX_RESPONSE_SIZE_BYTES} bytes.",
                        "is_json": False,
                        "json_data": None,
                        "size_bytes": len(content_bytes),
                        "outcome": "ERROR",
                        "error_message": "Response payload too large"
                    }

                # Attempt text decoding
                try:
                    text_body = response.text
                except Exception:
                    text_body = f"<Binary data: {len(content_bytes)} bytes>"

                # Check for JSON
                is_json = False
                json_data = None
                content_type = response.headers.get("content-type", "").lower()
                if "application/json" in content_type or (text_body and text_body.strip().startswith(("{", "["))):
                    try:
                        json_data = response.json()
                        is_json = True
                    except Exception:
                        is_json = False

                return {
                    "status_code": response.status_code,
                    "response_time_ms": round(elapsed_ms, 2),
                    "headers": dict(response.headers),
                    "body": text_body,
                    "is_json": is_json,
                    "json_data": json_data,
                    "size_bytes": len(content_bytes),
                    "outcome": "PASS" if response.is_success else "FAIL",
                    "error_message": None if response.is_success else f"HTTP {response.status_code} {response.reason_phrase}"
                }

            except SSRFSecurityError as ssrf_err:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return {
                    "status_code": None,
                    "response_time_ms": round(elapsed_ms, 2),
                    "headers": {},
                    "body": None,
                    "is_json": False,
                    "json_data": None,
                    "size_bytes": 0,
                    "outcome": "ERROR",
                    "error_message": f"Redirect blocked by SSRF Security: {ssrf_err.message}"
                }
            except httpx.TimeoutException:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return {
                    "status_code": None,
                    "response_time_ms": round(elapsed_ms, 2),
                    "headers": {},
                    "body": None,
                    "is_json": False,
                    "json_data": None,
                    "size_bytes": 0,
                    "outcome": "ERROR",
                    "error_message": f"Request timed out after {safe_timeout:.1f}s. The remote server did not respond in time."
                }
            except httpx.ConnectError as conn_err:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return {
                    "status_code": None,
                    "response_time_ms": round(elapsed_ms, 2),
                    "headers": {},
                    "body": None,
                    "is_json": False,
                    "json_data": None,
                    "size_bytes": 0,
                    "outcome": "ERROR",
                    "error_message": f"Connection failed: Unable to connect to host. {str(conn_err)}"
                }
            except httpx.HTTPError as http_err:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return {
                    "status_code": None,
                    "response_time_ms": round(elapsed_ms, 2),
                    "headers": {},
                    "body": None,
                    "is_json": False,
                    "json_data": None,
                    "size_bytes": 0,
                    "outcome": "ERROR",
                    "error_message": f"HTTP client error: {str(http_err)}"
                }
            except Exception as e:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return {
                    "status_code": None,
                    "response_time_ms": round(elapsed_ms, 2),
                    "headers": {},
                    "body": None,
                    "is_json": False,
                    "json_data": None,
                    "size_bytes": 0,
                    "outcome": "ERROR",
                    "error_message": f"Unexpected execution error: {str(e)}"
                }
