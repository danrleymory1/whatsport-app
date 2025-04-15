// src/services/events-service.ts
import { apiService } from './api-service';
import { Event } from '@/types/event';
import { toast } from 'sonner';

/**
 * Serviço especializado para lidar com eventos e gerenciar chamadas à API relacionadas
 */
class EventsService {
  /**
   * Busca eventos próximos com base na localização do usuário
   * @param location Localização do usuário (lat, lng)
   * @param radius Raio de busca em km (padrão: 10)
   */
  async getNearbyEvents(location: { lat: number, lng: number }, radius: number = 10): Promise<Event[]> {
    try {
      const response = await apiService.getNearbyEvents(location, radius);
      
      if (response.error) {
        console.warn("Error fetching nearby events:", response.error);
        return [];
      }
      
      // Extrair eventos da resposta normalizada
      const events = this.extractEventsFromResponse(response);
      return events;
    } catch (error) {
      console.error("Failed to get nearby events:", error);
      return [];
    }
  }
  
  /**
   * Busca eventos com filtros específicos
   * @param filters Filtros para busca de eventos
   */
  async getEvents(filters?: Record<string, any>): Promise<Event[]> {
    try {
      const response = await apiService.getEvents(filters);
      
      if (response.error) {
        console.warn("Error fetching events:", response.error);
        return [];
      }
      
      // Extrair eventos da resposta normalizada
      const events = this.extractEventsFromResponse(response);
      return events;
    } catch (error) {
      console.error("Failed to get events:", error);
      return [];
    }
  }
  
  /**
   * Cria um novo evento
   * @param eventData Dados do evento a ser criado
   */
  async createEvent(eventData: any): Promise<Event | null> {
    try {
      const response = await apiService.createEvent(eventData);
      
      if (response.error) {
        toast.error("Erro ao criar evento", {
          description: response.error
        });
        return null;
      }
      
      toast.success("Evento criado com sucesso!");
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error("Erro ao criar evento", {
        description: errorMessage
      });
      console.error("Failed to create event:", error);
      return null;
    }
  }
  
  /**
   * Participa de um evento existente
   * @param eventId ID do evento
   */
  async joinEvent(eventId: string): Promise<boolean> {
    try {
      const response = await apiService.joinEvent(eventId);
      
      if (response.error) {
        toast.error("Erro ao participar do evento", {
          description: response.error
        });
        return false;
      }
      
      toast.success("Você se juntou ao evento com sucesso!");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error("Erro ao participar do evento", {
        description: errorMessage
      });
      console.error("Failed to join event:", error);
      return false;
    }
  }
  
  /**
   * Extrai eventos de uma resposta da API, lidando com diferentes formatos
   * @param response Resposta da API
   */
  private extractEventsFromResponse(response: any): Event[] {
    if (!response || !response.data) {
      return [];
    }
    
    // Verificar se a resposta contém um array de eventos diretamente
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Verificar se a resposta contém um objeto com um array 'events'
    if (response.data.events && Array.isArray(response.data.events)) {
      return response.data.events;
    }
    
    // Verificar outras propriedades que podem conter arrays
    for (const key in response.data) {
      if (Array.isArray(response.data[key])) {
        return response.data[key];
      }
    }
    
    // Caso não encontre eventos, retornar array vazio
    return [];
  }
}

export const eventsService = new EventsService();