// src/services/map-service.ts
import { Location } from '@/types/event';

// Search result interface for Nominatim (OSM geocoding service)
interface SearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface GeocodingOptions {
  limit?: number;
  countrySet?: string;
}

class MapService {
  private readonly baseUrl: string = 'https://nominatim.openstreetmap.org';
  private mapScriptsLoaded: boolean = false;
  
  constructor() {
    // Nothing needed here for Leaflet implementation
  }
  
  // Load Leaflet SDK scripts if they aren't already loaded
  async loadMapScripts(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Check if Leaflet is already loaded
    if (window.L || this.mapScriptsLoaded) return;
    
    // Load CSS
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    leafletCss.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    leafletCss.crossOrigin = '';
    document.head.appendChild(leafletCss);
    
    // Load JS
    const leafletJs = document.createElement('script');
    leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletJs.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    leafletJs.crossOrigin = '';
    document.body.appendChild(leafletJs);
    
    // Wait for script to load
    await new Promise<void>((resolve) => {
      leafletJs.onload = () => {
        this.mapScriptsLoaded = true;
        resolve();
      };
    });
  }
  
  // Search by address or place name using Nominatim
  async searchAddress(query: string, options: GeocodingOptions = {}): Promise<SearchResult[]> {
    // Build URL with search parameters
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1'
    });
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.countrySet) params.append('countrycodes', options.countrySet);
    
    try {
      // Add a small delay to respect Nominatim usage policy (1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        headers: {
          'User-Agent': 'WhatsportApp/1.0'  // Best practice for Nominatim API
        }
      });
      
      if (!response.ok) throw new Error('Failed to search address');
      
      const data: SearchResult[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching address:', error);
      return [];
    }
  }
  
  // Reverse geocoding (get address from coordinates)
  async reverseGeocode(lat: number, lon: number): Promise<SearchResult | null> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1'
    });
    
    try {
      // Add a small delay to respect Nominatim usage policy
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`${this.baseUrl}/reverse?${params.toString()}`, {
        headers: {
          'User-Agent': 'WhatsportApp/1.0'
        }
      });
      
      if (!response.ok) throw new Error('Failed to reverse geocode');
      
      const data: SearchResult = await response.json();
      return data;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }
  
  // Convert SearchResult to our Location type
  toLocation(result: SearchResult): Location {
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      city: result.address?.city,
      state: result.address?.state,
      postal_code: result.address?.postcode
    };
  }
  
  // Calculate distance between two points in kilometers using the Haversine formula
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  // Get user's current position
  async getCurrentPosition(): Promise<{ lat: number, lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting current position:', error);
          resolve(null);
        }
      );
    });
  }
}

// Export the map service as a singleton instance
export const mapService = new MapService();