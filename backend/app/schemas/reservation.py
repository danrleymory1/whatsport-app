# backend/app/schemas/reservation.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, validator

from ..models.reservation import ReservationStatus

# --- Request Schemas ---

class ReservationCreate(BaseModel):
    space_id: str
    event_id: Optional[str] = None
    sport_type: str
    start_time: datetime
    end_time: datetime
    participants_count: int
    notes: Optional[str] = None
    
    @validator('end_time')
    def check_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('A data/hora de término deve ser posterior à data/hora de início')
        return v

class ReservationUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    participants_count: Optional[int] = None
    notes: Optional[str] = None

class ReservationReject(BaseModel):
    rejection_reason: str

# --- Response Schemas ---

class ReservationResponse(BaseModel):
    id: str
    space_id: str
    space_name: str
    event_id: Optional[str]
    organizer_id: str
    organizer_name: str
    organizer_email: str
    organizer_phone: Optional[str]
    sport_type: str
    start_time: datetime
    end_time: datetime
    participants_count: int
    total_price: float
    status: ReservationStatus
    notes: Optional[str]
    rejection_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

class ReservationList(BaseModel):
    reservations: List[ReservationResponse]
    total: int
    page: int
    per_page: int