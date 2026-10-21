from typing import Any, Dict, List
from pydantic import BaseModel
from app.schemas.history import HistoryItemResponse

class TimelinePoint(BaseModel):
    timestamp: str
    count: int
    avg_latency: float
    passed: int
    failed: int

class MethodCount(BaseModel):
    method: str
    count: int

class DashboardStats(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    error_requests: int
    success_rate: float
    avg_response_time_ms: float
    total_test_cases: int
    methods_distribution: List[MethodCount]
    timeline_data: List[TimelinePoint]
    recent_activity: List[HistoryItemResponse]
