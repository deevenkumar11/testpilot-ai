from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class ExecutionHistory(Base):
    __tablename__ = "execution_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    test_case_id = Column(Integer, ForeignKey("test_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    test_case_name = Column(String(255), nullable=True)
    method = Column(String(10), nullable=False)
    url = Column(Text, nullable=False)
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Float, nullable=False, default=0.0)
    outcome = Column(String(20), nullable=False)  # "PASS", "FAIL", "ERROR"
    
    request_headers = Column(JSON, nullable=True)
    request_params = Column(JSON, nullable=True)
    request_body = Column(Text, nullable=True)
    
    response_headers = Column(JSON, nullable=True)
    response_body = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    assertions_result = Column(JSON, nullable=True)
    ai_analysis = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=utc_now, index=True)

    test_case = relationship("TestCase", backref="execution_logs")
