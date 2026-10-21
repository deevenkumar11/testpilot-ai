import pytest
from app.services.ai_service import RuleBasedAnalyzer

def test_ai_analyzer_401_unauthorized():
    res = RuleBasedAnalyzer.analyze(
        method="GET",
        url="https://api.example.com/protected",
        status_code=401,
        response_time_ms=85.0,
        error_message="Unauthorized"
    )
    assert "401 Unauthorized" in res["summary"]
    assert any("Authorization" in fix for fix in res["suggested_fixes"])
    assert any("HTTP Status Code: 401" in fact for fact in res["confirmed_facts"])

def test_ai_analyzer_404_not_found():
    res = RuleBasedAnalyzer.analyze(
        method="GET",
        url="https://api.example.com/wrong-path",
        status_code=404,
        response_time_ms=92.0
    )
    assert "404 Not Found" in res["summary"]
    assert any("path" in fix.lower() or "endpoint" in fix.lower() for fix in res["suggested_fixes"])

def test_ai_analyzer_500_server_error():
    res = RuleBasedAnalyzer.analyze(
        method="POST",
        url="https://api.example.com/crash",
        status_code=500,
        response_time_ms=310.0
    )
    assert "500 Internal Server Error" in res["summary"]
    assert any("server-side logs" in fix.lower() for fix in res["suggested_fixes"])

def test_ai_analyzer_timeout_error():
    res = RuleBasedAnalyzer.analyze(
        method="GET",
        url="https://api.example.com/slow",
        status_code=None,
        response_time_ms=10005.0,
        error_message="Request timed out after 10.0s"
    )
    assert "timeout" in res["summary"].lower()
    assert any("timeout" in fix.lower() for fix in res["suggested_fixes"])

def test_ai_analyzer_assertion_failure():
    res = RuleBasedAnalyzer.analyze(
        method="GET",
        url="https://api.example.com/data",
        status_code=200,
        response_time_ms=150.0,
        assertions_result=[
            {"type": "json_field_exists", "target": "user.token", "passed": False, "message": "Field 'user.token' not found"}
        ]
    )
    assert "assertion(s) failed" in res["summary"]
    assert any("user.token" in fact for fact in res["confirmed_facts"])
