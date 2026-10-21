from typing import Any, Dict, List, Tuple
import json
from app.schemas.requests import AssertionItem, AssertionResult

def get_nested_value(data: Any, path: str) -> Tuple[bool, Any]:
    """
    Safely navigates dot-separated or bracket-separated JSON paths.
    E.g. 'user.profile.name' or 'items.0.id'
    Returns (found, value).
    """
    if data is None or not path:
        return False, None

    keys = path.replace("[", ".").replace("]", "").split(".")
    curr = data
    for key in keys:
        key = key.strip()
        if not key:
            continue
        if isinstance(curr, dict):
            if key in curr:
                curr = curr[key]
            else:
                return False, None
        elif isinstance(curr, list):
            try:
                idx = int(key)
                if 0 <= idx < len(curr):
                    curr = curr[idx]
                else:
                    return False, None
            except ValueError:
                return False, None
        else:
            return False, None
    return True, curr

def values_equal(actual: Any, expected: Any) -> bool:
    """Compare values with reasonable type coercion for user inputs."""
    if actual == expected:
        return True
    
    # Boolean conversions ("true", "false")
    if isinstance(actual, bool):
        if str(expected).lower() in ("true", "1"):
            return actual is True
        if str(expected).lower() in ("false", "0"):
            return actual is False

    # Numeric conversions
    try:
        if isinstance(actual, (int, float)) and isinstance(expected, (int, float, str)):
            return float(actual) == float(expected)
    except (ValueError, TypeError):
        pass

    # String comparison fallback
    return str(actual) == str(expected)

def evaluate_assertions(
    assertions: List[AssertionItem],
    status_code: int | None,
    response_time_ms: float,
    headers: Dict[str, str],
    raw_body: str | None,
    json_data: Any | None
) -> Tuple[List[AssertionResult], bool]:
    """
    Evaluates a list of assertions against the HTTP response data.
    Returns (results_list, all_passed).
    """
    results: List[AssertionResult] = []
    all_passed = True

    for a in assertions:
        a_type = a.type.lower()
        operator = (a.operator or "equals").lower()
        target = a.target or ""
        expected = a.expected

        passed = False
        actual = None
        message = ""

        try:
            if a_type == "status_code":
                actual = status_code
                if status_code is None:
                    passed = False
                    message = "No status code received (network or connection error)"
                else:
                    try:
                        exp_int = int(expected)
                        if operator in ("equals", "eq", "=="):
                            passed = (status_code == exp_int)
                            message = f"Status code is {status_code}" if passed else f"Expected {exp_int}, got {status_code}"
                        elif operator in ("not_equals", "ne", "!="):
                            passed = (status_code != exp_int)
                            message = f"Status code is not {exp_int}" if passed else f"Expected status code to not be {exp_int}"
                        elif operator in ("less_than", "lt", "<"):
                            passed = (status_code < exp_int)
                            message = f"Status code {status_code} < {exp_int}" if passed else f"Status code {status_code} not < {exp_int}"
                        elif operator in ("greater_than", "gt", ">"):
                            passed = (status_code > exp_int)
                            message = f"Status code {status_code} > {exp_int}" if passed else f"Status code {status_code} not > {exp_int}"
                        else:
                            passed = (status_code == exp_int)
                            message = f"Status code is {status_code}"
                    except ValueError:
                        passed = False
                        message = f"Invalid expected status code '{expected}'"

            elif a_type == "response_time":
                actual = round(response_time_ms, 2)
                try:
                    exp_float = float(expected)
                    if operator in ("less_than", "lt", "<", "equals"):
                        passed = (response_time_ms <= exp_float)
                        message = f"Response time {actual}ms <= {exp_float}ms" if passed else f"Response time {actual}ms exceeded threshold {exp_float}ms"
                    elif operator in ("greater_than", "gt", ">"):
                        passed = (response_time_ms >= exp_float)
                        message = f"Response time {actual}ms >= {exp_float}ms" if passed else f"Response time {actual}ms was below {exp_float}ms"
                    else:
                        passed = (response_time_ms <= exp_float)
                        message = f"Response time is {actual}ms"
                except ValueError:
                    passed = False
                    message = f"Invalid expected response time '{expected}'"

            elif a_type == "json_field_exists":
                if json_data is None:
                    passed = False
                    actual = None
                    message = "Response body is not valid JSON"
                else:
                    found, val = get_nested_value(json_data, target)
                    actual = "exists" if found else "does_not_exist"
                    if operator in ("not_exists", "missing"):
                        passed = not found
                        message = f"Field '{target}' does not exist as expected" if passed else f"Field '{target}' exists but was expected to be absent"
                    else:
                        passed = found
                        message = f"Field '{target}' exists in response" if passed else f"Field '{target}' not found in JSON response"

            elif a_type == "json_field_value":
                if json_data is None:
                    passed = False
                    actual = None
                    message = "Response body is not valid JSON"
                else:
                    found, val = get_nested_value(json_data, target)
                    actual = val
                    if not found:
                        passed = False
                        message = f"Field '{target}' not found in JSON response"
                    else:
                        if operator in ("equals", "eq", "=="):
                            passed = values_equal(val, expected)
                            message = f"Field '{target}' equals expected value" if passed else f"Field '{target}' has value {val!r}, expected {expected!r}"
                        elif operator in ("not_equals", "ne", "!="):
                            passed = not values_equal(val, expected)
                            message = f"Field '{target}' != {expected!r}" if passed else f"Field '{target}' unexpectedly equal to {expected!r}"
                        elif operator in ("contains", "has"):
                            passed = str(expected).lower() in str(val).lower()
                            message = f"Field '{target}' contains '{expected}'" if passed else f"Field '{target}' ({val!r}) does not contain '{expected}'"
                        elif operator in ("less_than", "lt"):
                            passed = float(val) < float(expected)
                            message = f"Field '{target}' ({val}) < {expected}" if passed else f"Field '{target}' ({val}) is not < {expected}"
                        elif operator in ("greater_than", "gt"):
                            passed = float(val) > float(expected)
                            message = f"Field '{target}' ({val}) > {expected}" if passed else f"Field '{target}' ({val}) is not > {expected}"
                        else:
                            passed = values_equal(val, expected)
                            message = f"Field '{target}' equals expected value" if passed else f"Field '{target}' expected {expected!r}, got {val!r}"

            elif a_type == "body_contains":
                actual = (raw_body[:100] + "...") if raw_body and len(raw_body) > 100 else raw_body
                if raw_body is None:
                    passed = False
                    message = "Empty response body"
                else:
                    exp_str = str(expected)
                    contains = exp_str in raw_body
                    if operator in ("not_contains", "missing"):
                        passed = not contains
                        message = f"Body does not contain '{exp_str}'" if passed else f"Body unexpectedly contains '{exp_str}'"
                    else:
                        passed = contains
                        message = f"Body contains '{exp_str}'" if passed else f"Body does not contain '{exp_str}'"

            elif a_type in ("header_exists", "header_value"):
                # Case-insensitive header check
                norm_headers = {k.lower(): v for k, v in headers.items()}
                target_key = target.lower()
                has_header = target_key in norm_headers
                actual = norm_headers.get(target_key)
                
                if a_type == "header_exists":
                    passed = has_header
                    message = f"Header '{target}' exists" if passed else f"Header '{target}' was not present"
                else:
                    if not has_header:
                        passed = False
                        message = f"Header '{target}' was not present"
                    else:
                        passed = values_equal(actual, expected)
                        message = f"Header '{target}' matched expected" if passed else f"Header '{target}' got {actual!r}, expected {expected!r}"

            else:
                passed = False
                message = f"Unknown assertion type '{a.type}'"

        except Exception as e:
            passed = False
            message = f"Error evaluating assertion: {str(e)}"

        if not passed:
            all_passed = False

        results.append(AssertionResult(
            id=a.id,
            type=a.type,
            target=a.target,
            operator=operator,
            expected=expected,
            actual=actual,
            passed=passed,
            message=message
        ))

    return results, all_passed
