from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # .env file config
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding='utf-8',
        extra='allow'  # Permite campos extras
    )

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Declare os campos adicionais
    NEXT_PUBLIC_TOMTOM_KEY: Optional[str] = None
    NEXT_PUBLIC_API_URL: Optional[str] = None
    FRONTEND_URL: Optional[str] = None

settings = Settings()