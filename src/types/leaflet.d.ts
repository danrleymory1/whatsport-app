// src/types/tomtom.d.ts
interface TomTomMapOptions {
    key: string;
    container?: HTMLElement; // Tornando opcional
    center?: [number, number] | { lat: number; lng: number };
    zoom?: number;
    style?: string;
    pitch?: number;
    bearing?: number;
    language?: string;
  }
  
  interface TomTomMarkerOptions {
    icon?: any;
    title?: string;
    draggable?: boolean;
    opacity?: number;
    zIndexOffset?: number;
  }
  
  interface TomTomIconOptions {
    iconUrl: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
    shadowUrl?: string;
    shadowSize?: [number, number];
    shadowAnchor?: [number, number];
  }
  
  interface TomTomLatLngBounds {
    extend: (latLng: [number, number]) => void;
    getCenter: () => [number, number];
    getNorthEast: () => [number, number];
    getSouthWest: () => [number, number];
  }
  
  interface TomTomMap {
    setCenter: (latLng: [number, number]) => void;
    setZoom: (zoom: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    fitBounds: (bounds: TomTomLatLngBounds, options?: {padding?: [number, number]}) => void;
    locate: (options: {setView?: boolean, maxZoom?: number}) => void;
    remove: () => void;
  }
  
  interface TomTomMarker {
    bindPopup: (content: string | HTMLElement) => TomTomMarker;
    openPopup: () => TomTomMarker;
    closePopup: () => TomTomMarker;
    on: (event: string, callback: Function) => void;
  }
  
  interface TomTomFeatureGroup {
    addLayer: (layer: any) => void;
    clearLayers: () => void;
    getBounds: () => TomTomLatLngBounds;
    addTo: (map: TomTomMap) => TomTomFeatureGroup;
  }
  
  interface TomTomL {
    map: (container: HTMLElement, options: TomTomMapOptions) => TomTomMap;
    featureGroup: () => TomTomFeatureGroup;
    marker: (coordinates: [number, number], options?: TomTomMarkerOptions) => TomTomMarker;
    icon: (options: TomTomIconOptions) => any;
  }
  
  interface TomTomStatic {
    L: TomTomL;
  }
  
  declare global {
    interface Window {
      tomtom?: TomTomStatic;
    }
  }
  
  export {};