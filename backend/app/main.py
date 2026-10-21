import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.models.test_case import TestCase
from app.api import health, dashboard, requests, test_cases, history, ai, settings as settings_api, mock_api

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("testpilot")

def seed_sample_data():
    """Seeds default demonstration test cases if database is empty."""
    db = SessionLocal()
    try:
        count = db.query(TestCase).count()
        if count == 0:
            logger.info("Database is empty. Seeding starter test cases...")
            samples = [
                TestCase(
                    name="JSONPlaceholder - Fetch Public Posts",
                    description="Verify public REST endpoint returns 200 OK and response latency is within 1500ms.",
                    method="GET",
                    url="https://jsonplaceholder.typicode.com/posts/1",
                    headers={"Accept": "application/json"},
                    params={},
                    body=None,
                    assertions=[
                        {"id": "a1", "type": "status_code", "operator": "equals", "expected": 200},
                        {"id": "a2", "type": "response_time", "operator": "less_than", "expected": 1500},
                        {"id": "a3", "type": "json_field_exists", "target": "title", "operator": "exists", "expected": True},
                        {"id": "a4", "type": "json_field_value", "target": "id", "operator": "equals", "expected": 1}
                    ]
                ),
                TestCase(
                    name="JSONPlaceholder - Create New Post",
                    description="Submit a POST request with JSON body and assert resource ID 101 creation.",
                    method="POST",
                    url="https://jsonplaceholder.typicode.com/posts",
                    headers={"Content-Type": "application/json"},
                    params={},
                    body='{\n  "title": "Automated Test Post",\n  "body": "Executed by TestPilot AI Engine",\n  "userId": 1\n}',
                    assertions=[
                        {"id": "b1", "type": "status_code", "operator": "equals", "expected": 201},
                        {"id": "b2", "type": "json_field_exists", "target": "id", "operator": "exists", "expected": True}
                    ]
                ),
                TestCase(
                    name="Mock API - 404 Route Verification",
                    description="Tests handling of non-existent resource and triggers AI Diagnostic evaluation.",
                    method="GET",
                    url="https://jsonplaceholder.typicode.com/unknown-endpoint-404",
                    headers={},
                    params={},
                    body=None,
                    assertions=[
                        {"id": "c1", "type": "status_code", "operator": "equals", "expected": 200}
                    ]
                )
            ]
            db.add_all(samples)
            db.commit()
            logger.info("Starter test cases seeded successfully.")
    except Exception as e:
        logger.warning(f"Error seeding sample data: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seeds
    init_db()
    seed_sample_data()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TestPilot AI — Intelligent API Testing & Automation Platform Backend",
    lifespan=lifespan
)

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safe Global Exception Handler: Protect against leaking stack traces or internal secrets
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing your request. Internal details have been omitted for security.",
            "path": request.url.path
        }
    )

# Include all API routes
app.include_router(health.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(requests.router, prefix="/api")
app.include_router(test_cases.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(settings_api.router, prefix="/api")
app.include_router(mock_api.router, prefix="/api")

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/health"
    }
