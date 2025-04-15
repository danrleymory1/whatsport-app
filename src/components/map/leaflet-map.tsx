// src/components/map/leaflet-map.tsx
"use client";

import { useRef, useEffect, useState } from 'react';
import { Event } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Locate, ZoomIn, ZoomOut } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  events?: Event[];
  onMarkerClick?: (event: Event) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  height?: string;
}

// Defining types for Leaflet since we're loading it dynamically
declare global {
  interface Window {
    L: any;
  }
}

export default function LeafletMap({
  events = [],
  onMarkerClick,
  initialCenter,
  initialZoom = 13,
  height = '100%',
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerLayer, setMarkerLayer] = useState<any>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  
  // Load Leaflet scripts
  useEffect(() => {
    // Check if Leaflet is already loaded
    if (window.L) {
      setIsLeafletLoaded(true);
      return;
    }
    
    const loadLeaflet = async () => {
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
      leafletJs.onload = () => {
        setIsLeafletLoaded(true);
      };
    };
    
    loadLeaflet();
  }, []);
  
  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !isLeafletLoaded) return;
    
    // Convert format of center if necessary
    const center = initialCenter 
      ? [initialCenter.lat, initialCenter.lng]
      : [0, 0];
    
    // Initialize map instance
    const map = window.L.map(mapRef.current).setView(center, initialZoom);
    
    // Add OpenStreetMap tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Create marker layer
    const layer = window.L.featureGroup().addTo(map);
    
    setMapInstance(map);
    setMarkerLayer(layer);
    
    // Get user location if no initialCenter
    if (!initialCenter) {
      map.locate({ setView: true, maxZoom: 15 });
    }
    
    // Cleanup
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [initialCenter, initialZoom, isLeafletLoaded]);
  
  // Update markers when events change
  useEffect(() => {
    if (!mapInstance || !markerLayer || !events.length || !isLeafletLoaded) return;
    
    // Clear previous markers
    markerLayer.clearLayers();
    
    // Add markers for events
    events.forEach((event) => {
      if (!event.location?.lat || !event.location?.lng) return;
      
      // Create custom icon
      const customIcon = window.L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #3B82F6; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${event.sport_type.charAt(0)}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      
      const marker = window.L.marker([event.location.lat, event.location.lng], {
        icon: customIcon,
        title: event.title,
      });
      
      // Add popup
      marker.bindPopup(`
        <div class="event-popup">
          <h3 style="font-weight: bold; margin-bottom: 8px;">${event.title}</h3>
          <p style="margin-bottom: 8px;">${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
          <p><strong>Esporte:</strong> ${event.sport_type}</p>
          <p><strong>Data:</strong> ${new Date(event.start_time).toLocaleString('pt-BR')}</p>
          <button style="background-color: #3B82F6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 8px;">Ver Detalhes</button>
        </div>
      `);
      
      // Handle click event
      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(event);
        }
      });
      
      // Add to layer
      markerLayer.addLayer(marker);
    });
    
    // Fit bounds if we have events
    if (events.length > 0) {
      mapInstance.fitBounds(markerLayer.getBounds(), { padding: [50, 50] });
    }
  }, [events, mapInstance, markerLayer, onMarkerClick, isLeafletLoaded]);
  
  // Locate user
  const handleLocateUser = () => {
    if (!mapInstance) return;
    
    try {
      mapInstance.locate({ setView: true, maxZoom: 15 });
    } catch (error) {
      console.error('Erro ao localizar usuário:', error);
    }
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    if (!mapInstance) return;
    
    try {
      mapInstance.zoomIn();
    } catch (error) {
      console.error('Erro ao aumentar zoom:', error);
    }
  };
  
  const handleZoomOut = () => {
    if (!mapInstance) return;
    
    try {
      mapInstance.zoomOut();
    } catch (error) {
      console.error('Erro ao diminuir zoom:', error);
    }
  };
  
  return (
    <div className="relative" style={{ height }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      
      {/* Map controls */}
      <div className="absolute right-4 top-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="shadow-md"
        >
          <ZoomIn size={18} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="shadow-md"
        >
          <ZoomOut size={18} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleLocateUser}
          className="shadow-md"
        >
          <Locate size={18} />
        </Button>
      </div>
    </div>
  );
}