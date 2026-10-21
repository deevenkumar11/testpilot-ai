import asyncio
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, HTTPException, Query, Response, status
from pydantic import BaseModel

router = APIRouter(prefix="/mock-api", tags=["Demo Mock Endpoints"])

MOCK_USERS = [
    {"id": 1, "name": "Ada Lovelace", "email": "ada@example.com", "role": "admin", "active": True},
    {"id": 2, "name": "Alan Turing", "email": "alan@example.com", "role": "engineer", "active": True},
    {"id": 3, "name": "Grace Hopper", "email": "grace@example.com", "role": "lead", "active": True},
    {"id": 4, "name": "Claude Shannon", "email": "claude@example.com", "role": "researcher", "active": False},
]

class CreateUserPayload(BaseModel):
    name: str
    email: str
    role: Optional[str] = "developer"

@router.get("/users")
def get_mock_users(limit: int = Query(10, ge=1, le=50)):
    """Retrieve demo users list."""
    return {
        "status": "success",
        "total": len(MOCK_USERS),
        "data": MOCK_USERS[:limit]
    }

@router.get("/users/{id}")
def get_mock_user_by_id(id: int):
    """Retrieve a single demo user by ID."""
    for u in MOCK_USERS:
        if u["id"] == id:
            return {"status": "success", "data": u}
    raise HTTPException(status_code=404, detail=f"User with ID {id} not found in database")

@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_mock_user(payload: CreateUserPayload):
    """Create a new mock user."""
    new_user = {
        "id": len(MOCK_USERS) + 1,
        "name": payload.name,
        "email": payload.email,
        "role": payload.role,
        "active": True
    }
    return {"status": "success", "message": "User created successfully", "data": new_user}

@router.get("/delay/{seconds}")
async def delayed_response(seconds: float):
    """Simulates a slow endpoint to test response time assertions and timeouts."""
    sleep_time = min(max(seconds, 0.1), 15.0)
    await asyncio.sleep(sleep_time)
    return {
        "status": "success",
        "delayed_seconds": sleep_time,
        "message": f"Response completed after {sleep_time} seconds"
    }

@router.get("/status/{code}")
def status_endpoint(code: int, response: Response):
    """Returns specified HTTP status code to test error handling & AI diagnostics."""
    if code == 400:
        raise HTTPException(status_code=400, detail="Bad Request: Missing required header or malformed query")
    elif code == 401:
        raise HTTPException(status_code=401, detail="Unauthorized: Access token is missing or expired")
    elif code == 403:
        raise HTTPException(status_code=403, detail="Forbidden: You lack necessary privileges for this resource")
    elif code == 404:
        raise HTTPException(status_code=404, detail="Not Found: The resource you requested does not exist")
    elif code == 422:
        raise HTTPException(status_code=422, detail="Unprocessable Entity: Schema validation failed on input parameter")
    elif code == 429:
        response.status_code = 429
        response.headers["Retry-After"] = "60"
        return {"error": "Rate limit exceeded", "retry_after_seconds": 60}
    elif code == 500:
        raise HTTPException(status_code=500, detail="Internal Server Error: Unhandled database connection exception")
    elif code == 503:
        raise HTTPException(status_code=503, detail="Service Unavailable: Upstream cluster unavailable")
    
    response.status_code = code
    return {"status": "custom", "code": code}

@router.get("/auth-test")
def auth_test(authorization: Optional[str] = Header(None)):
    """Validates authorization header format."""
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header. Please pass 'Authorization: Bearer testpilot-token'"
        )
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=400,
            detail="Invalid Authorization scheme. Header must begin with 'Bearer '"
        )
    token = authorization[7:].strip()
    if token != "testpilot-token":
        raise HTTPException(
            status_code=403,
            detail=f"Invalid token '{token}'. Expected 'testpilot-token'"
        )
    return {
        "status": "success",
        "authenticated": True,
        "message": "Token verified successfully! Welcome to TestPilot AI."
    }

@router.post("/echo")
def echo_endpoint(payload: Optional[Dict[str, Any]] = None):
    """Echoes received payload."""
    return {
        "status": "success",
        "received_payload": payload,
        "message": "Echo successful"
    }
