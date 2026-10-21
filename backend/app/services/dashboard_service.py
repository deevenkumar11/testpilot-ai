from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.history import ExecutionHistory
from app.models.test_case import TestCase
from app.schemas.dashboard import DashboardStats, MethodCount, TimelinePoint
from app.schemas.history import HistoryItemResponse

def get_dashboard_stats(db: Session) -> DashboardStats:
    """Computes real-time statistics from the SQLite database."""
    total_requests = db.query(func.count(ExecutionHistory.id)).scalar() or 0
    successful_requests = db.query(func.count(ExecutionHistory.id)).filter(ExecutionHistory.outcome == "PASS").scalar() or 0
    failed_requests = db.query(func.count(ExecutionHistory.id)).filter(ExecutionHistory.outcome == "FAIL").scalar() or 0
    error_requests = db.query(func.count(ExecutionHistory.id)).filter(ExecutionHistory.outcome == "ERROR").scalar() or 0

    # Average latency
    avg_latency = db.query(func.avg(ExecutionHistory.response_time_ms)).scalar() or 0.0

    # Success rate
    success_rate = round((successful_requests / total_requests * 100.0), 1) if total_requests > 0 else 100.0

    # Total test cases in database
    total_test_cases = db.query(func.count(TestCase.id)).scalar() or 0

    # Methods distribution
    method_rows = (
        db.query(ExecutionHistory.method, func.count(ExecutionHistory.id))
        .group_by(ExecutionHistory.method)
        .all()
    )
    methods_distribution = [
        MethodCount(method=method or "GET", count=count)
        for method, count in method_rows
    ]

    # Recent activity (10 latest records)
    recent_records = (
        db.query(ExecutionHistory)
        .order_by(desc(ExecutionHistory.created_at))
        .limit(10)
        .all()
    )
    recent_activity = [HistoryItemResponse.model_validate(r) for r in recent_records]

    # Timeline data: aggregated by day/date or recent sequential batches
    timeline_records = (
        db.query(ExecutionHistory)
        .order_by(ExecutionHistory.created_at.asc())
        .limit(100)
        .all()
    )

    # Group by date string (YYYY-MM-DD or HH:MM)
    date_buckets: Dict[str, Dict] = {}
    for r in timeline_records:
        date_key = r.created_at.strftime("%b %d, %H:%M") if r.created_at else "Unknown"
        if date_key not in date_buckets:
            date_buckets[date_key] = {"count": 0, "latencies": [], "passed": 0, "failed": 0}
        
        date_buckets[date_key]["count"] += 1
        date_buckets[date_key]["latencies"].append(r.response_time_ms)
        if r.outcome == "PASS":
            date_buckets[date_key]["passed"] += 1
        else:
            date_buckets[date_key]["failed"] += 1

    timeline_data = []
    for k, v in date_buckets.items():
        avg_lat = sum(v["latencies"]) / len(v["latencies"]) if v["latencies"] else 0.0
        timeline_data.append(TimelinePoint(
            timestamp=k,
            count=v["count"],
            avg_latency=round(avg_lat, 1),
            passed=v["passed"],
            failed=v["failed"]
        ))

    return DashboardStats(
        total_requests=total_requests,
        successful_requests=successful_requests,
        failed_requests=failed_requests,
        error_requests=error_requests,
        success_rate=success_rate,
        avg_response_time_ms=round(avg_latency, 1),
        total_test_cases=total_test_cases,
        methods_distribution=methods_distribution,
        timeline_data=timeline_data,
        recent_activity=recent_activity
    )
