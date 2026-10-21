from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "service" in data
    assert data["database"] == "connected"

def test_dashboard_stats_endpoint(client: TestClient):
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "success_rate" in data
    assert "methods_distribution" in data

def test_test_case_crud(client: TestClient):
    # 1. Create
    payload = {
        "name": "Integration Test Case",
        "description": "Verifies endpoint creation",
        "method": "GET",
        "url": "https://httpbin.org/get",
        "headers": {"X-Test": "123"},
        "params": {"foo": "bar"},
        "body": None,
        "assertions": [
            {"type": "status_code", "operator": "equals", "expected": 200}
        ]
    }
    create_res = client.post("/api/test-cases", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    tc_id = created["id"]
    assert created["name"] == payload["name"]

    # 2. Get by ID
    get_res = client.get(f"/api/test-cases/{tc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == tc_id

    # 3. List
    list_res = client.get("/api/test-cases")
    assert list_res.status_code == 200
    assert any(item["id"] == tc_id for item in list_res.json())

    # 4. Update
    update_res = client.put(f"/api/test-cases/{tc_id}", json={"name": "Updated Test Case Name"})
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Test Case Name"

    # 5. Delete
    del_res = client.delete(f"/api/test-cases/{tc_id}")
    assert del_res.status_code == 204

    # 6. Verify Deleted
    get_deleted = client.get(f"/api/test-cases/{tc_id}")
    assert get_deleted.status_code == 404

def test_mock_api_endpoints(client: TestClient):
    # Test Mock Users
    users_res = client.get("/api/mock-api/users")
    assert users_res.status_code == 200
    assert len(users_res.json()["data"]) > 0

    # Test Auth Test Endpoint without header -> 401
    unauth_res = client.get("/api/mock-api/auth-test")
    assert unauth_res.status_code == 401

    # Test Auth Test Endpoint with valid header -> 200
    auth_res = client.get("/api/mock-api/auth-test", headers={"Authorization": "Bearer testpilot-token"})
    assert auth_res.status_code == 200
    assert auth_res.json()["authenticated"] is True
