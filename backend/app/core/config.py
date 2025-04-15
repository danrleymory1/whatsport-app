# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # .env file config
    model_config = SettingsConfigDict(
        env_file="../.env", 
        env_file_encoding='utf-8',
        extra='allow'
    )

    # Configurações obrigatórias
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Configurações para CORS
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOW_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # Configurações opcionais
    NEXT_PUBLIC_TOMTOM_KEY: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = "noreply@whatsport.com"

settings = Settings()