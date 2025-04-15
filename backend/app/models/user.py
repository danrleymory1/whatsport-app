# backend/app/models/user.py
from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

# Helper para ID do MongoDB
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, _):  
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema_generator):
        return schema_generator({"type": "string"})

# Tipo de usuário
class UserType(str, Enum):
    PLAYER = "jogador"
    MANAGER = "gerente"

# Classe base com ID MongoDB
class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

# Modelo principal do usuário
class User(MongoBaseModel):
    email: EmailStr
    hashed_password: str
    user_type: UserType
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[datetime] = None
    profile_image: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Perfil do jogador (dados específicos)
class PlayerProfile(MongoBaseModel):
    user_id: PyObjectId
    sports: List[dict] = []  # Lista de esportes e níveis de habilidade
    events_participated: int = 0
    friends: List[PyObjectId] = []
    groups: List[PyObjectId] = []

# Perfil do gerente (dados específicos)
class ManagerProfile(MongoBaseModel):
    user_id: PyObjectId
    company_name: Optional[str] = None
    company_document: Optional[str] = None  # CNPJ
    company_address: Optional[str] = None
    bank_info: Optional[dict] = None