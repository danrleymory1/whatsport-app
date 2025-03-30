// src/types/space.ts
export interface SpacePhoto {
    id: string;
    url: string;
    is_primary: boolean;
  }
  
  export interface SpaceSport {
    sport_type: string;
    price_per_hour?: number;
    max_participants?: number;
  }
  
  export interface Space {
    id: string;
    name: string;
    description: string;
    location: Location;
    photos: SpacePhoto[];
    available_sports: SpaceSport[];
    amenities: string[];
    opening_hours: {
      [key: string]: { // day of week (0-6)
        opens_at: string;
        closes_at: string;
      }
    };
    manager_id: string;
    created_at: string;
    updated_at: string;
  }