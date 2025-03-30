// src/services/map-service.ts
import { Location } from '@/types/event';

// TomTom API types
interface SearchResult {
  id: string;
  score: number;
  address: {
    freeformAddress: string;
    streetName?: string;
    municipality?: string;
    countrySubdivision?: string;
    postalCode?: string;
    country?: string;
  };
  position: {
    lat: number;
    lon: number;
  };
}

interface SearchResponse {
  results: SearchResult[];
}

interface GeocodingOptions {
  limit?: number;
  countrySet?: string;
}

class MapService {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.tomtom.com';
  private mapScriptsLoaded: boolean = false;
  
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TOMTOM_KEY || '';
    if (!this.apiKey) {
      console.warn('TomTom API key not found. Map functionality will be limited.');
    }
  }
  
  // Load TomTom SDK scripts if they aren't already loaded
  async loadMapScripts(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Check if TomTom is already loaded
    if (window.tomtom || this.mapScriptsLoaded) return;
    
    // Load CSS
    const mapsCss = document.createElement('link');
    mapsCss.rel = 'stylesheet';
    mapsCss.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.23.0/maps/maps.css';
    document.head.appendChild(mapsCss);
    
    // Load JS
    const mapsJs = document.createElement('script');
    mapsJs.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.23.0/maps/maps-web.min.js';
    mapsJs.async = true;
    document.body.appendChild(mapsJs);
    
    // Wait for script to load
    await new Promise<void>((resolve) => {
      mapsJs.onload = () => {
        this.mapScriptsLoaded = true;
        resolve();
      };
    });
  }
  
  // Create a map instance
  createMap(container: HTMLElement, options: {
    center?: [number, number],
    zoom?: number,
    style?: string
  } = {}) {
    if (!window.tomtom) {
      console.error('TomTom SDK not loaded');
      return null;
    }
    
    return window.tomtom.L.map(container, {
      key: this.apiKey,
      container: container, // Adicionando a propriedade container
      center: options.center || [0, 0],
      zoom: options.zoom || 13,
      style: options.style || 'main'
    });
  }
  
  // Search by address or place name
  async searchAddress(query: string, options: GeocodingOptions = {}): Promise<SearchResult[]> {
    if (!this.apiKey) return [];
    
    const url = new URL(`${this.baseUrl}/search/2/search/${encodeURIComponent(query)}.json`);
    
    // Add API key and options
    url.searchParams.append('key', this.apiKey);
    if (options.limit) url.searchParams.append('limit', options.limit.toString());
    if (options.countrySet) url.searchParams.append('countrySet', options.countrySet);
    
    try {
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to search address');
      
      const data: SearchResponse = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error searching address:', error);
      return [];
    }
  }
  
  // Reverse geocoding (get address from coordinates)
  async reverseGeocode(lat: number, lon: number): Promise<SearchResult | null> {
    if (!this.apiKey) return null;
    
    const url = new URL(`${this.baseUrl}/search/2/reverseGeocode/${lat},${lon}.json`);
    url.searchParams.append('key', this.apiKey);
    
    try {
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to reverse geocode');
      
      const data: SearchResponse = await response.json();
      return data.results[0] || null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }
  
  // Convert SearchResult to our Location type
  toLocation(result: SearchResult): Location {
    return {
      lat: result.position.lat,
      lng: result.position.lon,
      address: result.address.freeformAddress,
      city: result.address.municipality,
      state: result.address.countrySubdivision,
      postal_code: result.address.postalCode
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

export const mapService = new MapService();