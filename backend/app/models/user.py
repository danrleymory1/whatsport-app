from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from enum import Enum
from bson import ObjectId

class UserType(str, Enum):
    PLAYER = "jogador"
    MANAGER = "gerente"

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, values, **kwargs):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None) #Importante para o MongoDB
    email: EmailStr
    hashed_password: str
    user_type: str  # "jogador" ou "gerente"

    class Config:
        populate_by_name = True #Permite usar _id e id
        json_encoders = {
            ObjectId: str
        }
        json_schema_extra = {  # Exemplo para a documentação da API
            "example": {
                "email": "jogador@example.com",
                "hashed_password": "senha_hash_segura",
                "user_type": "jogador",
            }
        }