"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { Event } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Locate, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import { googleMapsService } from '@/services/google-maps-service';

interface MapProps {
    events?: Event[];
    onMarkerClick?: (event: Event) => void;
    initialCenter?: { lat: number; lng: number };
    initialZoom?: number;
    height?: string;
}

// Defina um zoom padrão adequado para uma visão ampla
const DEFAULT_ZOOM = 12;
const MAX_ZOOM_AFTER_FITBOUNDS = 16;
const MIN_ZOOM_SINGLE_MARKER = 14;

export default function GoogleMap({
    events = [],
    onMarkerClick,
    initialCenter,
    initialZoom = DEFAULT_ZOOM,
    height = '400px',
}: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<any | null>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const infoWindowRef = useRef<any | null>(null);

    const [apiLoadState, setApiLoadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [apiError, setApiError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    // Obter localização do usuário
    useEffect(() => {
        async function getUserLocation() {
            try {
                const position = await googleMapsService.getCurrentPosition();
                if (position) {
                    setUserLocation(position);
                }
            } catch (error) {
                console.error("Erro ao obter localização do usuário:", error);
            }
        }

        getUserLocation();
    }, []);

    // Carregar a API do Google Maps e inicializar o mapa
    useEffect(() => {
        let isMounted = true;
        
        const initializeMap = async () => {
            if (apiLoadState !== 'idle' || !mapRef.current) return;
            
            try {
                setApiLoadState('loading');
                console.log("GoogleMap: Carregando API do Google Maps...");
                
                // Esperar que a API seja completamente carregada
                await googleMapsService.loadMapsApi();
                
                // Verificar se o componente ainda está montado
                if (!isMounted) return;
                
                // Verificar se a API foi carregada corretamente
                if (!window.google || !window.google.maps || !window.google.maps.Map) {
                    throw new Error("API do Google Maps não foi carregada corretamente");
                }
                
                console.log("GoogleMap: API carregada com sucesso, criando mapa...");
                
                // Escolher centro do mapa
                const center = initialCenter || userLocation || {lat: -15.77, lng: -47.92}; // Centro do Brasil como fallback
                
                // Criar instância do mapa
                const mapOptions = {
                    center: center,
                    zoom: initialZoom,
                    mapTypeId: 'roadmap', // Usar string em vez de enum
                    mapTypeControl: false,
                    fullscreenControl: false,
                    streetViewControl: false,
                    zoomControl: false,
                    clickableIcons: false,
                    gestureHandling: 'cooperative',
                };
                
                const map = new window.google.maps.Map(mapRef.current, mapOptions);
                setMapInstance(map);
                
                // Criar InfoWindow
                infoWindowRef.current = new window.google.maps.InfoWindow();
                
                // Se não houver centro inicial e não houver eventos, mas tiver localização do usuário
                if (!initialCenter && events.length === 0 && userLocation) {
                    map.setCenter(userLocation);
                }
                
                setApiLoadState('success');
                console.log("GoogleMap: Mapa inicializado com sucesso");
                
            } catch (error: any) {
                if (isMounted) {
                    console.error("GoogleMap: Erro ao inicializar mapa:", error);
                    setApiLoadState('error');
                    setApiError(error.message || "Erro desconhecido ao carregar o mapa");
                }
            }
        };
        
        initializeMap();
        
        return () => {
            isMounted = false;
        };
    }, [apiLoadState, initialCenter, initialZoom, userLocation, events.length]);

    // Atualizar Marcadores
    const updateMarkers = useCallback(() => {
        // Só atualizar marcadores se o mapa foi criado e a API está carregada
        if (!mapInstance || !window.google || !window.google.maps) return;

        console.log("GoogleMap: Atualizando marcadores...");
        const currentMarkers = markersRef.current;
        const newMarkers = new Map<string, any>();
        
        // Criar bounds para ajustar visualização a todos os marcadores
        const bounds = new window.google.maps.LatLngBounds();
        let validEventCount = 0;

        // Itera sobre os eventos atuais para criar/atualizar marcadores
        events.forEach(event => {
            if (!event.id || !event.location?.lat || !event.location?.lng) {
                return; // Pula evento inválido
            }

            const position = { lat: event.location.lat, lng: event.location.lng };
            let marker = currentMarkers.get(event.id);

            if (marker) {
                // Marcador existe, verifica se a posição mudou
                const currentPosition = marker.getPosition();
                if (currentPosition && 
                    (currentPosition.lat() !== position.lat || 
                     currentPosition.lng() !== position.lng)) {
                    marker.setPosition(position);
                }
                // Remove da lista antiga para saber quais sobraram para remover
                currentMarkers.delete(event.id);
            } else {
                // Marcador não existe, cria um novo
                try {
                    marker = new window.google.maps.Marker({
                        position: position,
                        map: mapInstance,
                        title: event.title,
                        icon: {
                            url: `https://maps.google.com/mapfiles/ms/icons/${event.sport_type === 'Futebol' ? 'blue' : 'red'}-dot.png`,
                        },
                    });

                    // Adiciona listener apenas na criação
                    marker.addListener('click', () => {
                        if (!infoWindowRef.current) return;
                        
                        const content = `
                            <div style="font-family: sans-serif; font-size: 14px; max-width: 250px;">
                                <h4 style="margin: 0 0 5px; font-size: 16px; font-weight: 600;">${event.title}</h4>
                                <p style="margin: 2px 0; color: #555;">${event.sport_type} - ${event.skill_level}</p>
                                <p style="margin: 2px 0; color: #555;">
                                    ${new Date(event.start_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                                <p style="margin: 2px 0; color: #555;">
                                    ${event.participants?.length || 0}/${event.max_participants} participantes
                                </p>
                                ${onMarkerClick ? '<button id="map-infowindow-details-btn" style="margin-top: 8px; padding: 4px 8px; font-size: 12px; cursor: pointer;">Ver Detalhes</button>' : ''}
                            </div>`;

                        infoWindowRef.current.setContent(content);
                        infoWindowRef.current.open(mapInstance, marker);

                        // Adiciona listener ao botão DEPOIS que a infoWindow está no DOM
                        if (onMarkerClick) {
                            const listener = window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
                                const button = document.getElementById('map-infowindow-details-btn');
                                button?.addEventListener('click', () => {
                                    onMarkerClick(event);
                                });
                            });
                        }
                    });

                } catch (error) {
                    console.error(`Erro ao criar marcador para ${event.id}:`, error);
                    return; // Pula este marcador se falhar
                }
            }

            // Adiciona o marcador ao novo mapa e estende os limites
            if (marker) {
                newMarkers.set(event.id, marker);
                bounds.extend(position);
                validEventCount++;
            }
        });

        // Remove marcadores que estavam no mapa mas não estão nos eventos atuais
        currentMarkers.forEach(markerToRemove => {
            markerToRemove.setMap(null);
        });

        // Atualiza a referência dos marcadores
        markersRef.current = newMarkers;

        // Ajusta o zoom para mostrar todos os marcadores visíveis
        if (validEventCount > 0 && !bounds.isEmpty()) {
            if (validEventCount === 1) {
                // Centraliza em único marcador com zoom específico
                mapInstance.setCenter(bounds.getCenter());
                const currentZoom = mapInstance.getZoom();
                if (currentZoom < MIN_ZOOM_SINGLE_MARKER) {
                    mapInstance.setZoom(MIN_ZOOM_SINGLE_MARKER);
                }
            } else {
                // Ajusta para múltiplos marcadores com padding
                mapInstance.fitBounds(bounds);

                // Limita o zoom máximo após fitBounds
                window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
                    const currentZoom = mapInstance.getZoom();
                    if (currentZoom > MAX_ZOOM_AFTER_FITBOUNDS) {
                        mapInstance.setZoom(MAX_ZOOM_AFTER_FITBOUNDS);
                    }
                });
            }
        }
        console.log(`GoogleMap: ${validEventCount} marcadores visíveis.`);

    }, [mapInstance, events, onMarkerClick]);

    // Chama updateMarkers quando os eventos ou o mapa mudam
    useEffect(() => {
        if (apiLoadState === 'success' && mapInstance) {
            updateMarkers();
        }
    }, [updateMarkers, apiLoadState, mapInstance]);

    // Controles do Mapa
    const handleLocateUser = useCallback(() => {
        if (!mapInstance) return;
        googleMapsService.getCurrentPosition().then(pos => {
            if (pos && mapInstance) {
                mapInstance.panTo(pos);
                mapInstance.setZoom(15);
                setUserLocation(pos);
            } else if (!pos) {
                alert("Não foi possível obter sua localização atual. Verifique as permissões do navegador.");
            }
        });
    }, [mapInstance]);

    const handleZoomIn = useCallback(() => {
        if (!mapInstance) return;
        const currentZoom = mapInstance.getZoom();
        mapInstance.setZoom(currentZoom + 1);
    }, [mapInstance]);

    const handleZoomOut = useCallback(() => {
        if (!mapInstance) return;
        const currentZoom = mapInstance.getZoom();
        mapInstance.setZoom(currentZoom - 1);
    }, [mapInstance]);

    return (
        <div className="relative bg-muted/30" style={{ height: height, width: '100%' }}>
            {/* Container do Mapa */}
            <div
                ref={mapRef}
                style={{ height: '100%', width: '100%', visibility: apiLoadState === 'success' ? 'visible' : 'hidden' }}
            />

            {/* Overlay de Carregamento */}
            {apiLoadState === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">Carregando mapa...</span>
                </div>
            )}

            {/* Overlay de Erro */}
            {apiLoadState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-destructive-foreground p-4 z-10 text-center">
                    <AlertTriangle className="h-10 w-10 mb-2 text-destructive" />
                    <p className="font-semibold mb-1">Erro ao carregar o mapa</p>
                    <p className="text-sm">{apiError || "Tente recarregar a página."}</p>
                </div>
            )}

            {/* Controles do Mapa (Visíveis apenas quando o mapa está pronto) */}
            {apiLoadState === 'success' && mapInstance && (
                <div className="absolute right-3 top-3 flex flex-col gap-2 z-10">
                    <Button variant="secondary" size="icon" onClick={handleZoomIn} className="shadow-md rounded-full" aria-label="Aproximar">
                        <ZoomIn size={18} />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={handleZoomOut} className="shadow-md rounded-full" aria-label="Afastar">
                        <ZoomOut size={18} />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={handleLocateUser} className="shadow-md rounded-full mt-2" aria-label="Localizar-me">
                        <Locate size={18} />
                    </Button>
                </div>
            )}
        </div>
    );
}