from app.schemas.requests import AssertionItem
from app.services.assertion_evaluator import evaluate_assertions

def test_status_code_assertions():
    assertions = [
        AssertionItem(type="status_code", operator="equals", expected=200),
        AssertionItem(type="status_code", operator="not_equals", expected=500),
        AssertionItem(type="status_code", operator="less_than", expected=300),
    ]
    results, all_passed = evaluate_assertions(
        assertions=assertions,
        status_code=200,
        response_time_ms=120.0,
        headers={},
        raw_body='{"ok": true}',
        json_data={"ok": True}
    )
    assert all_passed is True
    assert len(results) == 3
    assert all(r.passed for r in results)

def test_status_code_failure():
    assertions = [
        AssertionItem(type="status_code", operator="equals", expected=200),
    ]
    results, all_passed = evaluate_assertions(
        assertions=assertions,
        status_code=500,
        response_time_ms=150.0,
        headers={},
        raw_body="Internal Error",
        json_data=None
    )
    assert all_passed is False
    assert results[0].passed is False
    assert "Expected 200, got 500" in results[0].message

def test_response_time_assertion():
    assertions = [
        AssertionItem(type="response_time", operator="less_than", expected=500),
    ]
    results, all_passed = evaluate_assertions(
        assertions=assertions,
        status_code=200,
        response_time_ms=120.5,
        headers={},
        raw_body="",
        json_data=None
    )
    assert all_passed is True
    assert results[0].passed is True

    # Failed latency
    results_fail, all_passed_fail = evaluate_assertions(
        assertions=assertions,
        status_code=200,
        response_time_ms=750.0,
        headers={},
        raw_body="",
        json_data=None
    )
    assert all_passed_fail is False
    assert results_fail[0].passed is False

def test_json_field_assertions():
    json_payload = {
        "user": {
            "id": 42,
            "name": "Alice",
            "roles": ["admin", "editor"]
        },
        "status": "success",
        "active": True
    }
    assertions = [
        AssertionItem(type="json_field_exists", target="user.name", operator="exists", expected=True),
        AssertionItem(type="json_field_value", target="user.id", operator="equals", expected=42),
        AssertionItem(type="json_field_value", target="status", operator="equals", expected="success"),
        AssertionItem(type="json_field_value", target="active", operator="equals", expected=True),
        AssertionItem(type="body_contains", operator="contains", expected="Alice"),
    ]
    results, all_passed = evaluate_assertions(
        assertions=assertions,
        status_code=200,
        response_time_ms=50.0,
        headers={},
        raw_body='{"user": {"id": 42, "name": "Alice"}}',
        json_data=json_payload
    )
    assert all_passed is True
    assert len(results) == 5
