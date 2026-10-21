from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.dashboard import DashboardStats
from app.services.dashboard_service import get_dashboard_stats

router = APIRouter()

@router.get("/dashboard/stats", response_model=DashboardStats, tags=["Dashboard"])
def get_stats(db: Session = Depends(get_db)):
    """Fetch aggregated real-time dashboard analytics from the database."""
    return get_dashboard_stats(db)
