# backend/app/models/reservation.py
from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from bson import ObjectId

from .user import PyObjectId, MongoBaseModel

# Status das reservas
class ReservationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELED = "canceled"
    COMPLETED = "completed"

# Modelo de reserva
class Reservation(MongoBaseModel):
    space_id: str
    space_name: str
    event_id: Optional[str] = None
    organizer_id: str
    organizer_name: str
    organizer_email: str
    organizer_phone: Optional[str] = None
    sport_type: str
    start_time: datetime
    end_time: datetime
    participants_count: int
    total_price: float
    status: ReservationStatus = ReservationStatus.PENDING
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }