// src/types/notification.ts
export enum NotificationType {
    EVENT_INVITATION = "event_invitation",
    EVENT_REMINDER = "event_reminder",
    RESERVATION_REQUEST = "reservation_request",
    RESERVATION_APPROVED = "reservation_approved",
    RESERVATION_REJECTED = "reservation_rejected",
    FRIEND_REQUEST = "friend_request",
    NEW_MESSAGE = "new_message",
  }
  
  export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    related_id?: string; // ID of the related entity (event, reservation, etc.)
    is_read: boolean;
    created_at: string;
  }