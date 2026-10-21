from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    method = Column(String(10), nullable=False, default="GET")
    url = Column(Text, nullable=False)
    headers = Column(JSON, nullable=True, default=dict)
    params = Column(JSON, nullable=True, default=dict)
    body = Column(Text, nullable=True)
    assertions = Column(JSON, nullable=True, default=list)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
