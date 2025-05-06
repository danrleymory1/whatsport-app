// src/types/event.ts
export interface Location {
  lat: number;
  lng: number;
  address: string;
  place_id?: string; // Added place_id property
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface SportPosition {
  id: string;
  name: string;
  description?: string;
  quantity: number;
}

export interface Participant {
  user_id: string;
  user_name?: string;
  user_profile_image?: string;
  position_id?: string;
  position_name?: string;
  confirmed: boolean;
  joined_at?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  sport_type: string;
  skill_level: string; // beginner, intermediate, advanced
  start_time: string;
  end_time: string;
  location: Location;
  max_participants: number;
  participants: Participant[];
  positions?: SportPosition[];
  organizer_id: string;
  organizer_name: string;
  space_id?: string;
  space_name?: string;
  price_per_person?: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}