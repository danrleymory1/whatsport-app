// src/types/reservation.ts
export enum ReservationStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    CANCELED = "canceled",
    COMPLETED = "completed"
  }
  
  export interface Reservation {
    id: string;
    space_id: string;
    space_name: string;
    event_id?: string;
    organizer_id: string;
    organizer_name: string;
    sport_type: string;
    start_time: string;
    end_time: string;
    participants_count: number;
    total_price: number;
    status: ReservationStatus;
    created_at: string;
    updated_at: string;
  }