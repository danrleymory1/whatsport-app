# backend/app/schemas/user.py
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

# --- Request Schemas ---

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    user_type: str = Field(..., pattern="^(jogador|gerente)$")  # <--- Alterado aqui

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    password: str = Field(..., min_length=8)
    confirm_password: str

# --- Response Schemas ---

class UserResponse(BaseModel):
    id: str
    email: str
    user_type: str
    # Adicione outros campos que você queira retornar na resposta

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel): # Usado internamente, não exposto diretamente na API
    email: Optional[str] = None

class Message(BaseModel): # Para mensagens simples de sucesso/erro
    message: str