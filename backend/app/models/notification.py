# backend/app/models/notification.py
from typing import Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from bson import ObjectId

from .user import PyObjectId, MongoBaseModel

# Tipos de notificação
class NotificationType(str, Enum):
    EVENT_INVITATION = "event_invitation"
    EVENT_REMINDER = "event_reminder"
    EVENT_CREATED = "event_created"
    EVENT_UPDATED = "event_updated"
    EVENT_CANCELED = "event_canceled"
    EVENT_NEW_PARTICIPANT = "event_new_participant"
    EVENT_PARTICIPANT_LEFT = "event_participant_left"
    RESERVATION_REQUEST = "reservation_request"
    RESERVATION_APPROVED = "reservation_approved"
    RESERVATION_REJECTED = "reservation_rejected"
    RESERVATION_CANCELED = "reservation_canceled"
    FRIEND_REQUEST = "friend_request"
    NEW_MESSAGE = "new_message"

# Modelo de notificação
class Notification(MongoBaseModel):
    user_id: str
    type: NotificationType
    title: str
    message: str
    related_id: Optional[str] = None  # ID da entidade relacionada (evento, reserva, etc.)
    is_read: bool = False
    action_url: Optional[str] = None  # URL opcional para ação relacionada
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }