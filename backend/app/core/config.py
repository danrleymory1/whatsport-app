from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    # .env file config
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES: int = 60

    # Adicione outras configurações conforme necessário (ex: configurações de email)
    # EMAIL_HOST: str
    # EMAIL_PORT: int
    # EMAIL_USER: str
    # EMAIL_PASS: str

settings = Settings()