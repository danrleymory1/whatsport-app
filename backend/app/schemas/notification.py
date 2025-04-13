# backend/app/schemas/notification.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from ..models.notification import NotificationType

# --- Response Schemas ---

class NotificationResponse(BaseModel):
    id: str
    type: NotificationType
    title: str
    message: str
    related_id: Optional[str] = None
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime

class NotificationList(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int

# --- Request Schemas ---

class MarkAsReadRequest(BaseModel):
    notification_ids: List[str]