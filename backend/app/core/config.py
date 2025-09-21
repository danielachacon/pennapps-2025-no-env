from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PennApps Backend"
    VERSION: str = "0.1.0"
    ENV: str = "development"

    # Accept JSON array string from env (e.g., '["http://localhost:3000"]')
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # MongoDB settings
    MONGODB_URI: str = "mongodb://localhost:27017"  # Default fallback
    DATABASE_NAME: str = "pennapps"
    DB_PASSWORD: str = ""  # MongoDB Atlas password
    
    # API Keys for AI services
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    CEREBRAS_KEY: str = ""
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Allow extra fields in .env file
    )


settings = Settings()