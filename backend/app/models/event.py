# backend/app/models/event.py
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

from .user import PyObjectId, MongoBaseModel

# Modelos relacionados a eventos

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

class Event(MongoBaseModel):
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
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }