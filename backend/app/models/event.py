# backend/app/models/event.py
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

from ..models.user import PyObjectId

class Location(BaseModel):
    lat: float
    lng: float
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None

class SportPosition(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: int = 1

class Participant(BaseModel):
    user_id: str
    user_name: Optional[str] = None
    user_email: EmailStr
    position_id: Optional[str] = None
    position_name: Optional[str] = None
    confirmed: bool = False
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class Event(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str
    description: str
    sport_type: str
    skill_level: str
    start_time: datetime
    end_time: datetime
    location: Location
    max_participants: int
    participants: List[Participant] = []
    organizer_id: str
    organizer_name: Optional[str] = None
    space_id: Optional[str] = None
    space_name: Optional[str] = None
    price_per_person: float = 0
    is_private: bool = False
    positions: Optional[List[SportPosition]] = None
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
                "title": "Partida de Futebol",
                "description": "Partida amistosa de futebol society",
                "sport_type": "Futebol",
                "skill_level": "Intermediário",
                "start_time": "2023-10-15T18:00:00",
                "end_time": "2023-10-15T20:00:00",
                "location": {
                    "lat": -23.5505,
                    "lng": -46.6333,
                    "address": "Rua Exemplo, 123 - São Paulo, SP",
                    "city": "São Paulo",
                    "state": "SP"
                },
                "max_participants": 14,
                "organizer_id": "60d21b4667d0d8992e610c85",
                "price_per_person": 25.0,
                "is_private": False
            }
        }

# Esquemas para requisições
class EventCreate(BaseModel):
    title: str
    description: str
    sport_type: str
    skill_level: str
    start_time: datetime
    end_time: datetime
    location: Location
    max_participants: int
    space_id: Optional[str] = None
    price_per_person: float = 0
    is_private: bool = False
    positions: Optional[List[SportPosition]] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sport_type: Optional[str] = None
    skill_level: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[Location] = None
    max_participants: Optional[int] = None
    space_id: Optional[str] = None
    price_per_person: Optional[float] = None
    is_private: Optional[bool] = None
    positions: Optional[List[SportPosition]] = None

# Esquema para resposta
class EventResponse(BaseModel):
    id: str
    title: str
    description: str
    sport_type: str
    skill_level: str
    start_time: datetime
    end_time: datetime
    location: Location
    max_participants: int
    participants: List[Participant]
    organizer_id: str
    organizer_name: Optional[str]
    space_id: Optional[str]
    space_name: Optional[str]
    price_per_person: float
    is_private: bool
    positions: Optional[List[SportPosition]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

# Esquema para lista de eventos
class EventList(BaseModel):
    events: List[EventResponse]
    total: int
    page: int
    per_page: int
    
# Esquema para participação em evento
class JoinEventRequest(BaseModel):
    position_id: Optional[str] = None

class JoinEventResponse(BaseModel):
    event_id: str
    user_id: str
    success: bool
    message: str