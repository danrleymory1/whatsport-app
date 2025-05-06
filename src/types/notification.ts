// src/types/notification.ts
export enum NotificationType {
  EVENT_INVITATION = "event_invitation",
  EVENT_REMINDER = "event_reminder",
  EVENT_CREATED = "event_created",
  EVENT_UPDATED = "event_updated",
  EVENT_CANCELED = "event_canceled",
  EVENT_NEW_PARTICIPANT = "event_new_participant",
  EVENT_PARTICIPANT_LEFT = "event_participant_left",
  RESERVATION_REQUEST = "reservation_request",
  RESERVATION_APPROVED = "reservation_approved",
  RESERVATION_REJECTED = "reservation_rejected",
  RESERVATION_CANCELED = "reservation_canceled",
  RESERVATION_COMPLETED = "reservation_completed",
  FRIEND_REQUEST = "friend_request",
  NEW_MESSAGE = "new_message",
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  relatedId?: string; // ID of related entity (event, reservation, etc.)
}