// src/types/space.ts
export interface SpacePhoto {
  id: string;
  url: string;
  is_primary: boolean;
}

export interface SpaceSport {
  sport_type: string;
  price_per_hour: number;
  max_participants?: number;
  description?: string;
}

export interface SpaceLocation {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface SpaceAmenity {
  id: string;
  name: string;
}

export interface OpeningHours {
  [key: string]: { // day of week (0-6)
    opens_at: string;
    closes_at: string;
  }
}

export interface Space {
  id: string;
  name: string;
  description: string;
  location: SpaceLocation;
  photos: SpacePhoto[];
  available_sports: SpaceSport[];
  amenities: string[];
  opening_hours: OpeningHours;
  manager_id: string;
  created_at: string;
  updated_at: string;
}