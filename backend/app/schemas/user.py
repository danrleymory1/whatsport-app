# backend/app/schemas/user.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, validator

# --- Request Schemas ---

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    user_type: str = Field(..., pattern="^(jogador|gerente)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    password: str = Field(..., min_length=8)
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('As senhas não coincidem')
        return v

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[datetime] = None
    profile_image: Optional[str] = None

class PlayerProfileUpdate(BaseModel):
    sports: Optional[List[dict]] = None

class ManagerProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    company_document: Optional[str] = None
    company_address: Optional[str] = None
    bank_info: Optional[dict] = None

# --- Response Schemas ---

class UserResponse(BaseModel):
    id: str
    email: str
    user_type: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[datetime] = None
    profile_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class PlayerProfileResponse(BaseModel):
    user_id: str
    sports: List[dict] = []
    events_participated: int = 0

class ManagerProfileResponse(BaseModel):
    user_id: str
    company_name: Optional[str] = None
    company_document: Optional[str] = None
    company_address: Optional[str] = None
    bank_info: Optional[dict] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Message(BaseModel):
    message: str