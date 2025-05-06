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
    organizer_email?: string;
    organizer_phone?: string;
    sport_type: string;
    start_time: string;
    end_time: string;
    participants_count: number;
    total_price: number;
    notes?: string;
    rejection_reason?: string;
    status: ReservationStatus;
    created_at: string;
    updated_at: string;
}