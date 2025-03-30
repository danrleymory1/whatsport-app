# backend/app/models/space.py
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId

from ..models.user import PyObjectId
from ..models.event import Location

class SpacePhoto(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    url: str
    is_primary: bool = False
    added_at: datetime = Field(default_factory=datetime.utcnow)

class SpaceSport(BaseModel):
    sport_type: str
    price_per_hour: float = 0
    max_participants: Optional[int] = None
    description: Optional[str] = None

class OpeningHours(BaseModel):
    opens_at: str  # Format: "HH:MM"
    closes_at: str  # Format: "HH:MM"

class Space(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    description: str
    location: Location
    photos: List[SpacePhoto] = []
    available_sports: List[SpaceSport] = []
    amenities: List[str] = []
    opening_hours: Dict[str, OpeningHours] = {}  # Key is day of week (0-6, 0 is Monday)
    manager_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
        json_schema_extra = {
            "example": {
                "name": "Quadra Society Exemplo",
                "description": "Quadra de futebol society com grama sintética",
                "location": {
                    "lat": -23.5505,
                    "lng": -46.6333,
                    "address": "Rua Exemplo, 123 - São Paulo, SP",
                    "city": "São Paulo",
                    "state": "SP"
                },
                "available_sports": [
                    {
                        "sport_type": "Futebol",
                        "price_per_hour": 120,
                        "max_participants": 14
                    }
                ],
                "amenities": ["Vestiário", "Estacionamento", "Iluminação"],
                "opening_hours": {
                    "1": {"opens_at": "08:00", "closes_at": "22:00"},
                    "2": {"opens_at": "08:00", "closes_at": "22:00"},
                    "3": {"opens_at": "08:00", "closes_at": "22:00"},
                    "4": {"opens_at": "08:00", "closes_at": "22:00"},
                    "5": {"opens_at": "08:00", "closes_at": "22:00"},
                    "6": {"opens_at": "10:00", "closes_at": "20:00"},
                    "0": {"opens_at": "10:00", "closes_at": "18:00"}
                }
            }
        }

# Esquemas para requisições
class SpaceCreate(BaseModel):
    name: str
    description: str
    location: Location
    available_sports: List[SpaceSport]
    amenities: List[str] = []
    opening_hours: Dict[str, OpeningHours]

class SpaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[Location] = None
    available_sports: Optional[List[SpaceSport]] = None
    amenities: Optional[List[str]] = None
    opening_hours: Optional[Dict[str, OpeningHours]] = None

# Esquema para adicionar foto
class AddPhotoRequest(BaseModel):
    url: str
    is_primary: bool = False

# Esquema para resposta
class SpaceResponse(BaseModel):
    id: str
    name: str
    description: str
    location: Location
    photos: List[SpacePhoto]
    available_sports: List[SpaceSport]
    amenities: List[str]
    opening_hours: Dict[str, OpeningHours]
    manager_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

# Esquema para lista de espaços
class SpaceList(BaseModel):
    spaces: List[SpaceResponse]
    total: int
    page: int
    per_page: int