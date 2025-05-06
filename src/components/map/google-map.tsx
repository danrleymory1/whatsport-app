"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { Event } from '@/types/event'; // Ajuste o caminho se necessário
import { Button } from '@/components/ui/button'; // Ajuste o caminho se necessário
import { Locate, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import { googleMapsService } from '@/services/google-maps-service'; // Ajuste o caminho se necessário

// Declaração global para o objeto 'google.maps'
declare global {
    interface Window {
        google?: typeof google.maps; // Torna 'google' opcional e usa o tipo correto
    }
}

interface MapProps {
    events?: Event[];
    onMarkerClick?: (event: Event) => void;
    initialCenter?: { lat: number; lng: number }; // Centro inicial opcional
    initialZoom?: number;
    height?: string; // Altura do container do mapa
}

const DEFAULT_CENTER = { lat: -23.550520, lng: -46.633308 }; // São Paulo
const DEFAULT_ZOOM = 13;
const MAX_ZOOM_AFTER_FITBOUNDS = 16; // Zoom máximo após ajustar aos marcadores
const MIN_ZOOM_SINGLE_MARKER = 14; // Zoom ao centralizar em um único marcador

export default function GoogleMap({
    events = [],
    onMarkerClick,
    initialCenter,
    initialZoom = DEFAULT_ZOOM,
    height = '400px', // Define uma altura padrão razoável
}: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    // Usaremos um Map para gerenciar marcadores (key: event.id, value: google.maps.Marker)
    // Isso facilita a atualização e remoção sem recriar todos.
    const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null); // Apenas uma infoWindow reutilizável

    const [apiLoadState, setApiLoadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [apiError, setApiError] = useState<string | null>(null);

    // --- 1. Carregar a API do Google Maps ---
    useEffect(() => {
        let isMounted = true;
        if (apiLoadState === 'idle') {
            setApiLoadState('loading');
            console.log("GoogleMap: Iniciando carregamento da API...");
            googleMapsService.loadMapsApi()
                .then(() => {
                    if (isMounted) {
                        console.log("GoogleMap: API carregada com sucesso.");
                        setApiLoadState('success');
                        setApiError(null);
                    }
                })
                .catch((error) => {
                    if (isMounted) {
                        console.error("GoogleMap: Erro ao carregar API do Google Maps.", error);
                        setApiLoadState('error');
                        setApiError(error.message || "Falha ao carregar recursos do mapa.");
                    }
                });
        }
        return () => {
            isMounted = false;
        };
    }, [apiLoadState]); // Depende do estado para iniciar apenas uma vez

    // --- 2. Inicializar o Mapa ---
    useEffect(() => {
        // Só inicializa se a API carregou, o ref está pronto e o mapa ainda não foi criado
        if (apiLoadState !== 'success' || !mapRef.current || mapInstance) {
            return;
        }

        // Segurança extra: verificar se 'google.maps' existe mesmo
        if (!window.google?.maps) {
             console.error("GoogleMap: Estado da API é 'success', mas 'window.google.maps' não está disponível!");
             setApiLoadState('error');
             setApiError("Erro inesperado na inicialização do mapa.");
             return;
        }

        console.log("GoogleMap: Inicializando instância do mapa...");
        try {
            const center = initialCenter || DEFAULT_CENTER;
            const map = new window.google.maps.Map(mapRef.current, {
                center: center,
                zoom: initialZoom,
                mapTypeId: window.google.maps.MapTypeId.ROADMAP,
                mapTypeControl: false, // Simplificar UI
                fullscreenControl: false,
                streetViewControl: false,
                zoomControl: false, // Usaremos botões customizados
                clickableIcons: false, // Desabilita POIs clicáveis do Google
                gestureHandling: 'cooperative', // Requer Ctrl+Scroll para zoom, melhor em páginas com scroll
            });

            setMapInstance(map);

            // Inicializa a InfoWindow reutilizável
            infoWindowRef.current = new window.google.maps.InfoWindow();

            // Centraliza na localização do usuário se não houver centro inicial
            if (!initialCenter) {
                googleMapsService.getCurrentPosition().then(pos => {
                    if (pos && map) { // Verifica se 'map' ainda existe (componente pode desmontar)
                        map.setCenter(pos);
                    }
                });
            }

        } catch (error: any) {
             console.error("GoogleMap: Falha ao criar instância do mapa:", error);
             setApiLoadState('error');
             setApiError("Não foi possível inicializar o mapa.");
        }

    // Dependências: estado da API, ref do mapa, centro/zoom iniciais.
    // Adicionamos mapInstance para evitar recriação.
    }, [apiLoadState, initialCenter, initialZoom, mapInstance]);


    // --- 3. Atualizar Marcadores ---
    const updateMarkers = useCallback(() => {
        if (!mapInstance || !window.google?.maps) return;

        console.log("GoogleMap: Atualizando marcadores...");
        const currentMarkers = markersRef.current;
        const newMarkers = new Map<string, google.maps.Marker>();
        const bounds = new window.google.maps.LatLngBounds();
        let validEventCount = 0;

        // Itera sobre os eventos atuais para criar/atualizar marcadores
        events.forEach(event => {
            if (!event.id || !event.location?.lat || !event.location?.lng) {
                // console.warn(`Evento inválido ou sem localização: ${event.title || event.id}`);
                return; // Pula evento inválido
            }

            const position = { lat: event.location.lat, lng: event.location.lng };
            let marker = currentMarkers.get(event.id);

            if (marker) {
                // Marcador existe, verifica se a posição mudou (improvável, mas possível)
                if (!marker.getPosition()?.equals(new window.google.maps.LatLng(position))) {
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
                         // Usar ícones padrão para simplicidade e performance
                        icon: {
                            url: `https://maps.google.com/mapfiles/ms/icons/${event.sport_type === 'Futebol' ? 'blue' : 'red'}-dot.png`,
                            // scaledSize: new window.google.maps.Size(32, 32) // Se usar ícones customizados
                        },
                        // animation: window.google.maps.Animation.DROP, // Evitar animação para muitos marcadores
                    });

                    // Adiciona listener apenas na criação
                    marker.addListener('click', () => {
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

                        if (infoWindowRef.current) {
                            infoWindowRef.current.setContent(content);
                            infoWindowRef.current.open(mapInstance, marker);

                            // Adiciona listener ao botão DEPOIS que a infoWindow está no DOM
                             if (onMarkerClick) {
                                 const listener = infoWindowRef.current.addListener('domready', () => {
                                    const button = document.getElementById('map-infowindow-details-btn');
                                    button?.addEventListener('click', () => {
                                        onMarkerClick(event);
                                    });
                                    // Remove o listener de domready para não adicionar múltiplos listeners de botão
                                    window.google.maps.event.removeListener(listener);
                                });
                            }
                        }
                    });

                } catch (error) {
                    console.error(`Erro ao criar marcador para ${event.id}:`, error);
                    return; // Pula este marcador se falhar
                }
            }

            // Adiciona o marcador (novo ou atualizado) ao novo mapa e estende os limites
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
                if (mapInstance.getZoom()! < MIN_ZOOM_SINGLE_MARKER) {
                    mapInstance.setZoom(MIN_ZOOM_SINGLE_MARKER);
                }
            } else {
                 // Ajusta para múltiplos marcadores com padding
                mapInstance.fitBounds(bounds, 60); // 60px de padding

                // Opcional: Limita o zoom máximo após fitBounds
                const listener = window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
                    if (mapInstance.getZoom()! > MAX_ZOOM_AFTER_FITBOUNDS) {
                        mapInstance.setZoom(MAX_ZOOM_AFTER_FITBOUNDS);
                    }
                 });
            }
        } else if (validEventCount === 0) {
            // Nenhum marcador válido, talvez resetar para visão inicial?
             // mapInstance.setCenter(initialCenter || DEFAULT_CENTER);
             // mapInstance.setZoom(initialZoom);
        }
         console.log(`GoogleMap: ${validEventCount} marcadores visíveis.`);

    }, [mapInstance, events, onMarkerClick]); // Depende do mapa, eventos e callback

    // Chama updateMarkers quando os eventos ou o mapa mudam
    useEffect(() => {
        updateMarkers();
    }, [updateMarkers]); // updateMarkers já tem suas dependências corretas


    // --- Controles do Mapa ---
    const handleLocateUser = useCallback(() => {
        if (!mapInstance) return;
        googleMapsService.getCurrentPosition().then(pos => {
            if (pos && mapInstance) {
                mapInstance.panTo(pos); // Suave
                mapInstance.setZoom(15); // Zoom razoável para localização
            } else if (!pos) {
                 // Informar usuário que não foi possível obter localização
                 alert("Não foi possível obter sua localização atual. Verifique as permissões do navegador.");
            }
        });
    }, [mapInstance]);

    const handleZoomIn = useCallback(() => {
        if (!mapInstance) return;
        mapInstance.setZoom(mapInstance.getZoom()! + 1);
    }, [mapInstance]);

    const handleZoomOut = useCallback(() => {
        if (!mapInstance) return;
        mapInstance.setZoom(mapInstance.getZoom()! - 1);
    }, [mapInstance]);


    // --- Renderização ---
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