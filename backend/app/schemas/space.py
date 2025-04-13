# backend/app/schemas/space.py
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from ..models.space import SpacePhoto, SpaceSport, OpeningHours
from ..models.event import Location

# --- Request Schemas ---

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

class AddPhotoRequest(BaseModel):
    url: str
    is_primary: bool = False

# --- Response Schemas ---

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

class SpaceList(BaseModel):
    spaces: List[SpaceResponse]
    total: int
    page: int
    per_page: int