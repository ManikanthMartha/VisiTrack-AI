"""
Configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Storage
    STORAGE_PATH: str = "./storage"
    LOG_PATH: str = "./logs"
    
    # Anti-Detection
    HEADLESS: bool = False
    USE_STEALTH: bool = True
    RANDOM_DELAY_MIN: int = 1
    RANDOM_DELAY_MAX: int = 3
    
    # Rate Limiting
    RATE_LIMIT_DELAY: int = 180  # 3 minutes between requests
    MAX_CONCURRENT_SESSIONS: int = 3
    
    # Oxylabs Proxy Configuration
    OXYLABS_USERNAME: str = ""
    OXYLABS_PASSWORD: str = ""
    OXYLABS_PROXY_HOST: str = "dc.oxylabs.io"
    OXYLABS_PROXY_PORTS: str = "8001,8002,8003,8004,8005"
    USE_PROXY: bool = True  # MUST be True to use proxies
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
