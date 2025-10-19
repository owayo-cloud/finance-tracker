"""
Configuration module for Finance Tracker API.
Loads and validates environment variables using Pydantic Settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Uses Pydantic for validation and type checking.
    """
    
    # Application Settings
    APP_NAME: str = "Finance Tracker API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database Configuration
    DATABASE_URL: str
    DATABASE_URL_SYNC: str
    
    # JWT Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS Settings
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    
    @property
    def cors_origins(self) -> List[str]:
        """
        Parse comma-separated CORS origins into a list.
        Returns: List of allowed origin URLs
        """
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Password Requirements
    PASSWORD_MIN_LENGTH: int = 8
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 100
    
    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields in .env
    )

# Create a single instance to be imported throughout the app
# Let Pydantic Settings automatically load from .env file (as configured in model_config)
settings = Settings()

# Validate critical settings on import
def validate_settings():
    """
    Validate critical configuration values.
    Raises ValueError if configuration is invalid.
    """
    # Ensure required environment-backed settings are provided
    if not settings.DATABASE_URL:
        raise ValueError("DATABASE_URL must be set in environment or .env")
    if not settings.DATABASE_URL_SYNC:
        raise ValueError("DATABASE_URL_SYNC must be set in environment or .env")
    if not settings.SECRET_KEY:
        raise ValueError("SECRET_KEY must be set in environment or .env")

    if settings.ENVIRONMENT == "production":
        if settings.SECRET_KEY == "your-super-secret-key-change-this-in-production":
            raise ValueError(
                "SECRET_KEY must be changed in production environment"
            )
        
        if settings.DEBUG:
            raise ValueError(
                "DEBUG must be False in production environment"
            )
    
    if settings.ACCESS_TOKEN_EXPIRE_MINUTES < 5:
        raise ValueError(
            "ACCESS_TOKEN_EXPIRE_MINUTES should be at least 5 minutes"
        )
    
    if settings.PASSWORD_MIN_LENGTH < 8:
        raise ValueError(
            "PASSWORD_MIN_LENGTH should be at least 8 characters"
        )


# Do NOT run validation at import time. Some tooling (for example Alembic)
# imports this module without the full application environment and will
# fail if validation is performed on import. Call `validate_settings()`
# explicitly from the application entrypoint when you want to enforce
# runtime checks (for example, in `app/main.py` or startup scripts).
if __name__ == "__main__":
    # When executed directly, perform validation so developers can
    # verify their local .env / environment configuration.
    validate_settings()