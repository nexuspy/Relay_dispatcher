from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "Relay - AI Support Dispatcher"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///relay.db"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None

    # AI
    NVIDIA_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: str
    AI_MODEL_NAME: str = "gemini-1.5-flash"
    
    # Caching
    CACHE_ENABLED: bool = True
    CACHE_EXPIRE_SECONDS: int = 3600  # 1 hour

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
