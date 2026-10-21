from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings

router = APIRouter()

@router.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    db_healthy = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_healthy = False

    return {
        "status": "healthy" if db_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected" if db_healthy else "disconnected",
        "ssrf_protection": settings.SSRF_PROTECTION_ENABLED,
        "ai_provider": settings.AI_PROVIDER
    }
