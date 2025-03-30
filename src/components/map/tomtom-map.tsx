// src/components/map/tomtom-map.tsx
"use client";

import { useRef, useEffect, useState } from 'react';
import { Event } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Locate, ZoomIn, ZoomOut } from 'lucide-react';

interface MapProps {
  apiKey: string;
  events?: Event[];
  onMarkerClick?: (event: Event) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  height?: string;
}

export default function TomTomMap({
  apiKey,
  events = [],
  onMarkerClick,
  initialCenter,
  initialZoom = 13,
  height = '100%',
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerLayer, setMarkerLayer] = useState<any>(null);
  
  // Load TomTom SDK scripts
  useEffect(() => {
    // Check if TomTom is already loaded
    if (window.tomtom) return;
    
    const loadMapScripts = async () => {
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
      return new Promise<void>((resolve) => {
        mapsJs.onload = () => resolve();
      });
    };
    
    loadMapScripts();
  }, []);
  
  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.tomtom || !apiKey) return;
    
    // Verificar se tomtom está definido
    if (!window.tomtom) {
      console.error('TomTom SDK não está carregado');
      return;
    }
    
    // Converter formato do centro se necessário
    const center = initialCenter 
      ? [initialCenter.lat, initialCenter.lng] as [number, number]
      : [0, 0] as [number, number];
    
    // Initialize map instance
    const map = window.tomtom.L.map(mapRef.current, {
      key: apiKey,
      container: mapRef.current, // Adicionando a propriedade container
      center: center,
      zoom: initialZoom,
    });
    
    // Create marker layer
    const layer = window.tomtom.L.featureGroup().addTo(map);
    
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
  }, [apiKey, initialCenter, initialZoom]);
  
  // Update markers when events change
  useEffect(() => {
    if (!mapInstance || !markerLayer || !events.length) return;
    
    // Clear previous markers
    markerLayer.clearLayers();
    
    // Add markers for events
    events.forEach((event) => {
      if (!event.location?.lat || !event.location?.lng) return;
      
      // Verificar se tomtom está definido
      if (!window.tomtom) {
        console.error('TomTom SDK não está carregado');
        return;
      }
      
      const marker = window.tomtom.L.marker([event.location.lat, event.location.lng], {
        icon: window.tomtom.L.icon({
          iconUrl: '/icons/event-marker.svg',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        }),
        title: event.title,
      });
      
      // Add popup
      marker.bindPopup(`
        <div class="event-popup">
          <h3>${event.title}</h3>
          <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
          <p><strong>Esporte:</strong> ${event.sport_type}</p>
          <p><strong>Data:</strong> ${new Date(event.start_time).toLocaleString('pt-BR')}</p>
          <button class="view-event-btn">Ver Detalhes</button>
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
  }, [events, mapInstance, markerLayer, onMarkerClick]);
  
  // Locate user
  const handleLocateUser = () => {
    if (!mapInstance) return;
    
    // Verificação de segurança
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