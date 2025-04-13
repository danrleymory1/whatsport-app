# backend/app/models/space.py
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId

from .user import PyObjectId, MongoBaseModel
from .event import Location

# Modelos relacionados a espaços esportivos

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

class Space(MongoBaseModel):
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
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }