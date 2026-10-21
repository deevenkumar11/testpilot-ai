import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.schemas.ai import AIAnalysisResponse

class RuleBasedAnalyzer:
    """
    Intelligent rule-based diagnostic engine.
    Analyzes status codes, assertion failures, error messages, and payload structures.
    """
    @staticmethod
    def analyze(
        method: str,
        url: str,
        status_code: Optional[int],
        response_time_ms: float,
        error_message: Optional[str] = None,
        response_body: Optional[str] = None,
        response_headers: Optional[Dict[str, str]] = None,
        request_headers: Optional[Dict[str, str]] = None,
        request_body: Optional[str] = None,
        assertions_result: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        confirmed_facts: List[str] = []
        possible_causes: List[str] = []
        suggested_fixes: List[str] = []
        
        # 1. Collect Facts
        confirmed_facts.append(f"HTTP Method: {method.upper()}")
        confirmed_facts.append(f"Target URL: {url}")
        confirmed_facts.append(f"Response Latency: {response_time_ms:.1f} ms")
        
        if status_code is not None:
            confirmed_facts.append(f"HTTP Status Code: {status_code}")
        if error_message:
            confirmed_facts.append(f"Reported System Error: {error_message}")

        # Check for failed assertions
        failed_assertions = []
        if assertions_result:
            for a in assertions_result:
                if not a.get("passed", False):
                    failed_assertions.append(a)

        if failed_assertions:
            for fa in failed_assertions:
                confirmed_facts.append(f"Assertion Failure: {fa.get('message', 'Failed assertion')}")

        # 2. Analyze based on error condition
        summary = ""

        # Case A: Network / SSRF / Connection Failure
        if status_code is None:
            err_lower = (error_message or "").lower()
            if "ssrf" in err_lower or "security" in err_lower or "restricted" in err_lower:
                summary = "Request was blocked by SSRF Security Policy to protect private internal infrastructure."
                possible_causes.append("The target URL resolved to a loopback address (127.0.0.1, localhost), private RFC1918 IP, or cloud metadata service (169.254.169.254).")
                possible_causes.append("The target service redirected to an internal network address.")
                suggested_fixes.append("Verify the URL is a publicly accessible API endpoint.")
                suggested_fixes.append("If testing locally during development, use the built-in mock endpoints or configure development mode.")
            elif "timed out" in err_lower:
                summary = f"The remote server did not respond within the configured timeout window ({response_time_ms:.1f}ms)."
                possible_causes.append("The remote server is undergoing heavy load, cold starting, or hanging on a database query.")
                possible_causes.append("A network firewall or security group dropped SYN packets silently.")
                suggested_fixes.append("Increase the request timeout setting in the request builder (e.g., 15s to 30s).")
                suggested_fixes.append("Check the health and latency of the target server directly.")
                suggested_fixes.append("Ensure the target host and port are publicly open to incoming traffic.")
            elif "dns" in err_lower or "resolve" in err_lower:
                summary = "Failed to resolve domain name into an IP address."
                possible_causes.append("Typo in the hostname or domain name.")
                possible_causes.append("The domain does not exist or has expired DNS records.")
                suggested_fixes.append("Double-check the spelling of the domain in the URL.")
                suggested_fixes.append("Verify domain DNS resolution using nslookup or dig.")
            else:
                summary = f"Network connection failed: {error_message or 'Unable to reach target host'}"
                possible_causes.append("The target port is closed or not accepting connections.")
                possible_causes.append("SSL/TLS handshake failure or self-signed certificate.")
                suggested_fixes.append("Verify that the target server is online and listening on the specified port.")
                suggested_fixes.append("If testing a staging server with self-signed SSL, toggle off 'Verify SSL' in Request Settings.")

        # Case B: HTTP 4xx Client Errors
        elif status_code == 400:
            summary = "HTTP 400 Bad Request: The server could not understand or accept the request payload or syntax."
            possible_causes.append("Malformed JSON request body (e.g., missing quotes, trailing commas).")
            possible_causes.append("Required request parameters or fields are missing.")
            possible_causes.append("Query parameter format or data types violate the API's contract.")
            suggested_fixes.append("Check the JSON request body using the 'Prettify JSON' tool to ensure valid formatting.")
            suggested_fixes.append("Inspect the API documentation for mandatory headers and body parameters.")
            suggested_fixes.append("Inspect the response body above for specific validation errors returned by the server.")

        elif status_code == 401:
            summary = "HTTP 401 Unauthorized: Authentication credentials are missing, expired, or invalid."
            possible_causes.append("Missing 'Authorization' header (e.g., 'Bearer <token>' or 'Basic <creds>').")
            possible_causes.append("The token has expired or the API key was revoked.")
            possible_causes.append("The API expects an alternative header such as 'x-api-key' or 'apikey'.")
            suggested_fixes.append("Add an 'Authorization' header in the Request Headers tab.")
            suggested_fixes.append("Verify your API token or refresh expired OAuth access tokens.")
            suggested_fixes.append("Check if the API expects token prefix 'Bearer ' before the token value.")

        elif status_code == 403:
            summary = "HTTP 403 Forbidden: You are authenticated, but not authorized to access this resource."
            possible_causes.append("Your user or API token lacks required roles/scopes for this resource.")
            possible_causes.append("CORS (Cross-Origin Resource Sharing) or IP whitelist restrictions on the API.")
            possible_causes.append("WAF (Web Application Firewall) like Cloudflare or AWS WAF detected unusual headers.")
            suggested_fixes.append("Check your account permissions and role scopes for this specific endpoint.")
            suggested_fixes.append("Verify that your API client IP is allowed if the API uses IP allowlisting.")
            suggested_fixes.append("Include standard User-Agent and Accept headers.")

        elif status_code == 404:
            summary = "HTTP 404 Not Found: The requested URL endpoint or resource does not exist on this server."
            possible_causes.append("Typo in the URL path, versioning prefix (e.g. /v1 vs /v2), or trailing slash mismatch.")
            possible_causes.append("The specific resource ID passed in the URL path does not exist in the database.")
            possible_causes.append("The route exists under a different base path or subdomain.")
            suggested_fixes.append("Verify the URL path against official API documentation.")
            suggested_fixes.append("Check for trailing slashes (e.g. try '/users' instead of '/users/').")
            suggested_fixes.append("Ensure the resource ID in the URL is valid and active.")

        elif status_code == 405:
            summary = f"HTTP 405 Method Not Allowed: The resource exists, but does not support '{method}'."
            possible_causes.append(f"Endpoint only supports GET/POST and does not allow {method}.")
            suggested_fixes.append(f"Check the response 'Allow' header to see supported HTTP methods.")
            suggested_fixes.append("Switch to an allowed method (e.g., POST instead of PUT).")

        elif status_code == 422:
            summary = "HTTP 422 Unprocessable Entity: Request data was well-formed JSON but failed semantic validation."
            possible_causes.append("Field schema validation failure (e.g., string passed where integer expected).")
            possible_causes.append("Missing required fields defined in OpenAPI/Pydantic schema.")
            suggested_fixes.append("Read the response body details to see exactly which field failed validation.")
            suggested_fixes.append("Ensure data types (numbers, booleans, strings) strictly match the API schema.")

        elif status_code == 429:
            summary = "HTTP 429 Too Many Requests: Rate limit has been exceeded."
            possible_causes.append("Sent too many requests within the API's rate limiting window.")
            possible_causes.append("Shared IP or concurrent test execution triggered rate limits.")
            suggested_fixes.append("Check the 'Retry-After' header to see when requests can resume.")
            suggested_fixes.append("Implement exponential backoff or add delays between test runs.")

        # Case C: HTTP 5xx Server Errors
        elif status_code == 500:
            summary = "HTTP 500 Internal Server Error: The remote server encountered an unhandled exception."
            possible_causes.append("Unhandled null pointer, uncaught exception, or syntax crash in the API backend.")
            possible_causes.append("Downstream database connection failure or deadlocked transaction.")
            possible_causes.append("Unexpected payload format that wasn't properly guarded on the server.")
            suggested_fixes.append("Inspect the server-side logs if you maintain the service.")
            suggested_fixes.append("Try sending minimal request body to isolate the field triggering the crash.")
            suggested_fixes.append("If this is a third-party service, report the issue to their support.")

        elif status_code in (502, 503, 504):
            names = {502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout"}
            summary = f"HTTP {status_code} {names.get(status_code, 'Gateway Error')}: Upstream backend proxy failure."
            possible_causes.append("The reverse proxy (Nginx, Cloudflare, ALB) cannot reach the application server.")
            possible_causes.append("The application container crashed, restarted, or is starting up.")
            suggested_fixes.append("Check if the application service process is running behind the proxy.")
            suggested_fixes.append("Inspect reverse proxy access and error logs.")

        # Case D: Assertion Failures on otherwise 2xx/3xx response
        elif failed_assertions:
            summary = f"HTTP request succeeded with status {status_code}, but {len(failed_assertions)} test assertion(s) failed."
            for fa in failed_assertions:
                a_type = fa.get("type")
                if a_type == "status_code":
                    possible_causes.append(f"Status assertion failed: Expected status code {fa.get('expected')}, but received {status_code}.")
                    suggested_fixes.append(f"Update test expectation if status {status_code} is legitimate, or fix request payload.")
                elif a_type == "response_time":
                    possible_causes.append(f"Latency ({response_time_ms:.1f}ms) exceeded maximum threshold ({fa.get('expected')}ms).")
                    suggested_fixes.append("Optimize server-side query performance or increase response time threshold.")
                elif a_type in ("json_field_exists", "json_field_value"):
                    possible_causes.append(f"JSON field mismatch: API response schema does not match expected path '{fa.get('target')}'.")
                    suggested_fixes.append(f"Check the response body to verify the actual JSON key hierarchy.")
                elif a_type == "body_contains":
                    possible_causes.append(f"Body did not contain expected substring '{fa.get('expected')}'.")
                    suggested_fixes.append("Verify the expected text or string against current API response.")

        else:
            summary = f"Response completed with status {status_code}."
            possible_causes.append("Request completed within normal parameters.")
            suggested_fixes.append("No errors detected.")

        return {
            "summary": summary,
            "confirmed_facts": confirmed_facts,
            "possible_causes": possible_causes,
            "suggested_fixes": suggested_fixes,
            "provider": "rule_based",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

class LLMAnalyzer:
    """
    LLM-powered Diagnostic Engine.
    Calls Gemini or OpenAI if API keys are configured, otherwise falls back to RuleBasedAnalyzer.
    """
    @staticmethod
    async def analyze_with_llm(
        method: str,
        url: str,
        status_code: Optional[int],
        response_time_ms: float,
        error_message: Optional[str] = None,
        response_body: Optional[str] = None,
        response_headers: Optional[Dict[str, str]] = None,
        request_headers: Optional[Dict[str, str]] = None,
        request_body: Optional[str] = None,
        assertions_result: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        
        # If Gemini key is set, try Gemini
        if settings.GEMINI_API_KEY:
            try:
                result = await LLMAnalyzer._call_gemini(
                    method=method,
                    url=url,
                    status_code=status_code,
                    response_time_ms=response_time_ms,
                    error_message=error_message,
                    response_body=response_body,
                    request_headers=request_headers,
                    request_body=request_body,
                    assertions_result=assertions_result
                )
                if result:
                    return result
            except Exception:
                pass  # Fall back gracefully

        # If OpenAI key is set, try OpenAI
        if settings.OPENAI_API_KEY:
            try:
                result = await LLMAnalyzer._call_openai(
                    method=method,
                    url=url,
                    status_code=status_code,
                    response_time_ms=response_time_ms,
                    error_message=error_message,
                    response_body=response_body,
                    request_headers=request_headers,
                    request_body=request_body,
                    assertions_result=assertions_result
                )
                if result:
                    return result
            except Exception:
                pass  # Fall back gracefully

        # Default fallback to Rule-Based Analyzer
        return RuleBasedAnalyzer.analyze(
            method=method,
            url=url,
            status_code=status_code,
            response_time_ms=response_time_ms,
            error_message=error_message,
            response_body=response_body,
            response_headers=response_headers,
            request_headers=request_headers,
            request_body=request_body,
            assertions_result=assertions_result
        )

    @staticmethod
    async def _call_gemini(
        method: str,
        url: str,
        status_code: Optional[int],
        response_time_ms: float,
        error_message: Optional[str],
        response_body: Optional[str],
        request_headers: Optional[Dict[str, str]],
        request_body: Optional[str],
        assertions_result: Optional[List[Dict[str, Any]]]
    ) -> Optional[Dict[str, Any]]:
        # Truncate response body if too large for prompt
        safe_resp_body = (response_body[:1500] + "... [truncated]") if response_body and len(response_body) > 1500 else response_body
        safe_req_body = (request_body[:1000] + "... [truncated]") if request_body and len(request_body) > 1000 else request_body

        prompt = f"""
You are an expert API Testing and Troubleshooting Assistant. Analyze this failed API request/test.
Return ONLY valid JSON matching this schema:
{{
  "summary": "Short 1-2 sentence overview of failure",
  "confirmed_facts": ["fact 1", "fact 2"],
  "possible_causes": ["probable cause 1", "probable cause 2"],
  "suggested_fixes": ["actionable step 1", "actionable step 2"]
}}

Request Details:
Method: {method}
URL: {url}
Status Code: {status_code}
Latency: {response_time_ms} ms
Error: {error_message}
Request Body: {safe_req_body}
Response Body: {safe_resp_body}
Failed Assertions: {json.dumps(assertions_result or [])}
"""
        model = settings.AI_MODEL or "gemini-1.5-flash"
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                endpoint,
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"}
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                return {
                    "summary": parsed.get("summary", "Analysis completed"),
                    "confirmed_facts": parsed.get("confirmed_facts", []),
                    "possible_causes": parsed.get("possible_causes", []),
                    "suggested_fixes": parsed.get("suggested_fixes", []),
                    "provider": f"gemini ({model})",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
        return None

    @staticmethod
    async def _call_openai(
        method: str,
        url: str,
        status_code: Optional[int],
        response_time_ms: float,
        error_message: Optional[str],
        response_body: Optional[str],
        request_headers: Optional[Dict[str, str]],
        request_body: Optional[str],
        assertions_result: Optional[List[Dict[str, Any]]]
    ) -> Optional[Dict[str, Any]]:
        safe_resp_body = (response_body[:1500] + "... [truncated]") if response_body and len(response_body) > 1500 else response_body
        safe_req_body = (request_body[:1000] + "... [truncated]") if request_body and len(request_body) > 1000 else request_body

        prompt = f"""
You are an expert API Testing and Troubleshooting Assistant. Analyze this failed API request/test.
Return ONLY valid JSON matching this schema:
{{
  "summary": "Short 1-2 sentence overview of failure",
  "confirmed_facts": ["fact 1", "fact 2"],
  "possible_causes": ["probable cause 1", "probable cause 2"],
  "suggested_fixes": ["actionable step 1", "actionable step 2"]
}}

Request Details:
Method: {method}
URL: {url}
Status Code: {status_code}
Latency: {response_time_ms} ms
Error: {error_message}
Request Body: {safe_req_body}
Response Body: {safe_resp_body}
Failed Assertions: {json.dumps(assertions_result or [])}
"""
        model = settings.AI_MODEL or "gpt-4o-mini"
        endpoint = "https://api.openai.com/v1/chat/completions"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                endpoint,
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": model,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": "You are a professional API debugging assistant. Output valid JSON only."},
                        {"role": "user", "content": prompt}
                    ]
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                parsed = json.loads(text)
                return {
                    "summary": parsed.get("summary", "Analysis completed"),
                    "confirmed_facts": parsed.get("confirmed_facts", []),
                    "possible_causes": parsed.get("possible_causes", []),
                    "suggested_fixes": parsed.get("suggested_fixes", []),
                    "provider": f"openai ({model})",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
        return None

async def analyze_api_failure(
    method: str,
    url: str,
    status_code: Optional[int],
    response_time_ms: float,
    error_message: Optional[str] = None,
    response_body: Optional[str] = None,
    response_headers: Optional[Dict[str, str]] = None,
    request_headers: Optional[Dict[str, str]] = None,
    request_body: Optional[str] = None,
    assertions_result: Optional[List[Dict[str, Any]]] = None,
    force_provider: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main entry point for AI Error Explanation.
    Uses LLM if available and requested, otherwise falls back to RuleBasedAnalyzer.
    """
    provider = force_provider or settings.AI_PROVIDER
    
    if provider in ("gemini", "openai", "llm"):
        return await LLMAnalyzer.analyze_with_llm(
            method=method,
            url=url,
            status_code=status_code,
            response_time_ms=response_time_ms,
            error_message=error_message,
            response_body=response_body,
            response_headers=response_headers,
            request_headers=request_headers,
            request_body=request_body,
            assertions_result=assertions_result
        )

    # Default: Fast, deterministic rule-based expert engine
    return RuleBasedAnalyzer.analyze(
        method=method,
        url=url,
        status_code=status_code,
        response_time_ms=response_time_ms,
        error_message=error_message,
        response_body=response_body,
        response_headers=response_headers,
        request_headers=request_headers,
        request_body=request_body,
        assertions_result=assertions_result
    )
