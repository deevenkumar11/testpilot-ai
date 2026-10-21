import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "TestPilot AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./testpilot.db")
    
    # SSRF & Network Security
    SSRF_PROTECTION_ENABLED: bool = os.getenv("SSRF_PROTECTION_ENABLED", "true").lower() in ("true", "1", "yes")
    DEFAULT_TIMEOUT_SECONDS: float = float(os.getenv("DEFAULT_TIMEOUT_SECONDS", "10.0"))
    MAX_TIMEOUT_SECONDS: float = float(os.getenv("MAX_TIMEOUT_SECONDS", "30.0"))
    MAX_REQUEST_SIZE_BYTES: int = int(os.getenv("MAX_REQUEST_SIZE_BYTES", str(5 * 1024 * 1024)))
    MAX_RESPONSE_SIZE_BYTES: int = int(os.getenv("MAX_RESPONSE_SIZE_BYTES", str(10 * 1024 * 1024)))
    
    # AI Error Analysis
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "rule_based")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "")

settings = Settings()
