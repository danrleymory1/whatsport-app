# backend/app/models/user.py - simplified version of PyObjectId class
from typing import Optional, List, Any, Annotated
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from bson import ObjectId

# Simpler PyObjectId approach using annotations
def validate_object_id(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid ObjectId")
    return str(v)

# Annotated type for ObjectId
PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]

# Tipo de usuário
class UserType(str, Enum):
    PLAYER = "jogador"
    MANAGER = "gerente"

# Classe base com ID MongoDB
class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_schema_extra": {"example": {"id": "123456789012345678901234"}},
        "json_encoders": {
            ObjectId: str
        }
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