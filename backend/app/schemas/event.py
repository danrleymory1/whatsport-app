# backend/app/schemas/event.py
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, validator

from ..models.event import Location, SportPosition, Participant

# --- Request Schemas ---

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
    
    @validator('end_time')
    def check_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('A data/hora de término deve ser posterior à data/hora de início')
        return v

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

class JoinEventRequest(BaseModel):
    position_id: Optional[str] = None

# --- Response Schemas ---

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

class EventList(BaseModel):
    events: List[EventResponse]
    total: int
    page: int
    per_page: int

class JoinEventResponse(BaseModel):
    event_id: str
    user_id: str
    success: bool
    message: str