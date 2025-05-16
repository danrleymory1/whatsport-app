// src/services/google-maps-service.ts
import { Location } from '@/types/event';

// Tipos para geocodificação
interface GeocodingResult {
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
        location_type: string;
    };
    place_id: string;
    address_components: Array<{
        long_name: string;
        short_name: string;
        types: string[];
    }>;
}

interface GeocodingResponse {
    results: GeocodingResult[];
    status: string;
}

// Variáveis de nível de módulo para garantir o carregamento único
let loadingPromise: Promise<void> | null = null;
let isApiLoaded = false;

class GoogleMapsService {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        if (!this.apiKey) {
            console.warn("Chave da API do Google Maps (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) não está definida no .env.local ou .env");
        }
    }

    /**
     * Carrega a API do Google Maps de forma segura, garantindo que o script
     * seja adicionado ao DOM apenas uma vez. Retorna uma Promise que resolve
     * quando a API está carregada ou rejeita em caso de erro.
     */
    async loadMapsApi(): Promise<void> {
        // 1. Verifica se a API já está carregada (globalmente ou pelo nosso serviço)
        if (typeof window !== 'undefined' && window.google?.maps) {
            isApiLoaded = true; // Garante que nosso estado interno esteja sincronizado
            return Promise.resolve();
        }
        if (isApiLoaded) {
            return Promise.resolve();
        }

        // 2. Se já existe uma Promise de carregamento em andamento, retorna ela
        if (loadingPromise) {
            return loadingPromise;
        }

        // 3. Inicia um novo processo de carregamento
        loadingPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined') {
                console.warn("Tentativa de carregar a API do Google Maps fora do ambiente do navegador.");
                return reject(new Error("Não é possível carregar a API do Google Maps fora do navegador"));
            }

            const scriptId = 'google-maps-api-script';
            // Verifica se o script já existe no DOM (segurança adicional)
            if (document.getElementById(scriptId)) {
                console.warn("Script do Google Maps já existe no DOM, mas 'window.google.maps' não está pronto. Aguardando carregamento existente...");
            }

            console.log("Iniciando carregamento do script da API do Google Maps...");
            const script = document.createElement('script');
            script.id = scriptId;
            // Usar 'loading=async' é a forma recomendada pela Google para carregar a API programaticamente
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places&loading=async`;
            script.async = true; // Boa prática, embora 'loading=async' já controle isso.
            script.defer = true; // Garante execução após o parse do HTML.

            script.onload = () => {
                console.log("Script da API do Google Maps carregado com sucesso.");
                if (window.google?.maps) {
                    isApiLoaded = true;
                    resolve();
                } else {
                    console.error("Script do Google Maps carregado, mas 'window.google.maps' não está definido.");
                    loadingPromise = null; // Permite nova tentativa
                    reject(new Error("Falha na inicialização da API do Google Maps após o carregamento do script"));
                }
            };

            script.onerror = (error) => {
                console.error('Falha ao carregar o script da API do Google Maps:', error);
                loadingPromise = null; // Permite nova tentativa em chamadas futuras
                document.getElementById(scriptId)?.remove(); // Remove o script falho se ele foi adicionado
                reject(new Error('Falha ao carregar o script da API do Google Maps'));
            };

            // Adiciona o script ao final do head
            document.head.appendChild(script);
        });

        return loadingPromise;
    }

    /**
     * Geocodifica um endereço para obter coordenadas e detalhes.
     */
    async geocodeAddress(address: string): Promise<Location | null> {
        if (!address) return null;
        try {
            await this.loadMapsApi(); // Garante que a API esteja carregada

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}&language=pt-BR`
            );

            if (!response.ok) {
                throw new Error(`Falha na requisição de geocodificação: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as GeocodingResponse;

            if (data.status !== 'OK' || !data.results.length) {
                console.warn(`Erro na geocodificação ou nenhum resultado para "${address}": ${data.status}`);
                return null;
            }

            const result = data.results[0];
            const location: Location = {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                address: result.formatted_address,
                place_id: result.place_id, // Adiciona place_id se útil
            };

            // Extrai componentes do endereço
            for (const component of result.address_components) {
                if (component.types.includes('locality')) {
                    location.city = component.long_name;
                } else if (component.types.includes('administrative_area_level_1')) {
                    location.state = component.short_name; // Usa short_name para estado (ex: SP)
                } else if (component.types.includes('postal_code')) {
                    location.postal_code = component.long_name;
                } else if (component.types.includes('country')) {
                    location.country = component.long_name;
                }
            }

            return location;
        } catch (error) {
            console.error(`Erro ao geocodificar o endereço "${address}":`, error);
            return null;
        }
    }

    /**
     * Geocodificação reversa: obtém endereço a partir de coordenadas.
     */
    async reverseGeocode(lat: number, lng: number): Promise<Location | null> {
        try {
            await this.loadMapsApi(); // Garante que a API esteja carregada

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}&language=pt-BR`
            );

            if (!response.ok) {
                throw new Error(`Falha na requisição de geocodificação reversa: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as GeocodingResponse;

            if (data.status !== 'OK' || !data.results.length) {
                console.warn(`Erro na geocodificação reversa ou nenhum resultado para ${lat},${lng}: ${data.status}`);
                return null;
            }

            // Tenta encontrar o endereço mais específico primeiro (geralmente o primeiro resultado)
            const result = data.results[0];
            const location: Location = {
                lat,
                lng,
                address: result.formatted_address,
                 place_id: result.place_id,
            };

            // Extrai componentes (similar ao geocodeAddress)
             for (const component of result.address_components) {
                if (component.types.includes('locality')) location.city = component.long_name;
                else if (component.types.includes('administrative_area_level_1')) location.state = component.short_name;
                else if (component.types.includes('postal_code')) location.postal_code = component.long_name;
                else if (component.types.includes('country')) location.country = component.long_name;
            }

            return location;
        } catch (error) {
            console.error(`Erro na geocodificação reversa para ${lat},${lng}:`, error);
            return null;
        }
    }

    /**
     * Calcula a distância entre dois pontos usando a API do Google Maps.
     * Se a API não estiver disponível, usa a fórmula de Haversine como fallback.
     * @param origin Ponto de origem (lat, lng) ou endereço
     * @param destination Ponto de destino (lat, lng) ou endereço
     * @param useHaversine Força o uso da fórmula de Haversine em vez da API (opcional)
     * @returns Distância em metros
     */
    async calculateDistance(
        origin: { lat: number; lng: number } | string,
        destination: { lat: number; lng: number } | string,
        useHaversine = false
    ): Promise<number> {
        try {
            // Se useHaversine é true, vamos direto para o cálculo de Haversine
            if (useHaversine) {
                return await this.calculateHaversineDistance(origin, destination);
            }

            // Tenta usar a API do Google Maps Distance Matrix
            await this.loadMapsApi();
            
            // Converter endereços para coordenadas se necessário
            const originCoords = typeof origin === 'string' ? await this.geocodeAddress(origin) : origin;
            const destCoords = typeof destination === 'string' ? await this.geocodeAddress(destination) : destination;
            
            if (!originCoords || !destCoords) {
                throw new Error('Não foi possível obter coordenadas válidas para calcular a distância');
            }

            return new Promise((resolve, reject) => {
                // Garantir que o objeto google.maps existe
                if (!window.google || !window.google.maps) {
                    this.calculateHaversineDistance(originCoords, destCoords)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                const service = new window.google.maps.DistanceMatrixService();
                
                // Criando variáveis para evitar erros de undefined
                let originLatLng;
                if (typeof originCoords === 'string') {
                    originLatLng = originCoords;
                } else {
                    originLatLng = new window.google.maps.LatLng(originCoords.lat, originCoords.lng);
                }
                
                let destLatLng;
                if (typeof destCoords === 'string') {
                    destLatLng = destCoords;
                } else {
                    destLatLng = new window.google.maps.LatLng(destCoords.lat, destCoords.lng);
                }
                
                service.getDistanceMatrix(
                    {
                        origins: [originLatLng],
                        destinations: [destLatLng],
                        travelMode: window.google.maps.TravelMode.DRIVING,
                    },
                    (response, status) => {
                        if (status === 'OK' && response?.rows[0]?.elements[0]?.status === 'OK') {
                            resolve(response.rows[0].elements[0].distance.value);
                        } else {
                            console.warn(`API Distance Matrix falhou: ${status}, usando Haversine como fallback`);
                            // Usa Haversine como fallback
                            this.calculateHaversineDistance(originCoords, destCoords)
                                .then(resolve)
                                .catch(reject);
                        }
                    }
                );
            });
        } catch (error) {
            console.warn('Erro ao calcular distância com Google Maps, usando Haversine:', error);
            return this.calculateHaversineDistance(origin, destination);
        }
    }

    /**
     * Calcula a distância entre dois pontos usando a fórmula de Haversine.
     * Não requer API do Google Maps, funciona offline.
     * @param origin Ponto de origem (lat, lng) ou endereço
     * @param destination Ponto de destino (lat, lng) ou endereço
     * @returns Distância em metros
     */
    private async calculateHaversineDistance(
        origin: { lat: number; lng: number } | string,
        destination: { lat: number; lng: number } | string
    ): Promise<number> {
        try {
            // Converter endereços para coordenadas se necessário
            const originCoords = typeof origin === 'string' ? await this.geocodeAddress(origin) : origin;
            const destCoords = typeof destination === 'string' ? await this.geocodeAddress(destination) : destination;

            if (!originCoords || !destCoords) {
                throw new Error('Coordenadas inválidas para cálculo de distância Haversine');
            }

            const R = 6371e3; // Raio da Terra em metros
            const phi1 = this.deg2rad(originCoords.lat);
            const phi2 = this.deg2rad(destCoords.lat);
            const deltaPhi = this.deg2rad(destCoords.lat - originCoords.lat);
            const deltaLambda = this.deg2rad(destCoords.lng - originCoords.lng);

            const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return distance;
        } catch (error) {
            console.error('Erro ao calcular distância Haversine:', error);
            return 0;
        }
    }
    private deg2rad(deg: number): number { return deg * (Math.PI / 180); }

    /**
     * Obtém a posição atual do usuário usando a API de Geolocalização do navegador.
     * Não depende diretamente da API do Google Maps, mas é frequentemente usada em conjunto.
     */
    async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
        return new Promise((resolve) => {
            if (typeof navigator !== 'undefined' && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.warn('Erro ao obter a posição atual:', error.message);
                        resolve(null); // Retorna nulo em caso de erro (ex: permissão negada)
                    },
                    { // Opções (opcional)
                        enableHighAccuracy: false, // Pode economizar bateria
                        timeout: 10000, // 10 segundos
                        maximumAge: 60000 // Aceita posição em cache de até 1 minuto
                    }
                );
            } else {
                console.warn('Geolocalização não é suportada neste navegador ou ambiente.');
                resolve(null);
            }
        });
    }

    /**
     * Searches for an address using the Geocoding API
     * @param address The address to search for
     * @returns An array of address results
     */
    async searchAddress(address: string): Promise<any[]> {
        if (!address.trim()) return [];
        
        try {
            await this.loadMapsApi(); // Ensure the API is loaded
            
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}&language=pt-BR`
            );
            
            if (!response.ok) {
                throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status !== 'OK' || !data.results.length) {
                // Return empty array if no results found
                return [];
            }
            
            // Transform the response to a format more suitable for our UI
            return data.results.map((result: any) => ({
                address: {
                    freeformAddress: result.formatted_address,
                    countrySubdivision: result.address_components.find((c: any) => 
                        c.types.includes('administrative_area_level_1')
                    )?.short_name || null
                },
                position: {
                    lat: result.geometry.location.lat,
                    lon: result.geometry.location.lng
                },
                id: result.place_id
            }));
        } catch (error) {
            console.error('Error searching address:', error);
            return [];
        }
    }
  
    /**
     * Converts a geocoding result to our Location type
     * @param result The geocoding result to convert
     * @returns A Location object
     */
    toLocation(result: any): { address: string; city?: string; state?: string; postal_code?: string; lat: number; lng: number } {
        try {
            // Extract the components from the result
            const location = {
                address: result.address.freeformAddress,
                lat: result.position.lat,
                lng: result.position.lon
            } as { 
                address: string; 
                city?: string; 
                state?: string; 
                postal_code?: string; 
                lat: number; 
                lng: number 
            };
            
            // If there are address components in the result, extract them
            if (result.address) {
                if (result.address.municipality) {
                    location.city = result.address.municipality;
                }
                
                if (result.address.countrySubdivision) {
                    location.state = result.address.countrySubdivision;
                }
                
                if (result.address.postalCode) {
                    location.postal_code = result.address.postalCode;
                }
            }
            
            return location;
        } catch (error) {
            console.error('Error converting to location:', error);
            return {
                address: result.address?.freeformAddress || '',
                lat: result.position?.lat || 0,
                lng: result.position?.lon || 0
            };
        }
    }
}

// Exporta uma instância singleton do serviço
export const googleMapsService = new GoogleMapsService();