// src/services/api-service.ts
import Cookies from 'js-cookie';

interface RegisterPayload {
  email: string;
  password: string;
  user_type: string;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  password: string;
  confirm_password: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
  private async request<T>(
    endpoint: string, 
    method: string = 'GET', 
    data?: any,
    useFormData: boolean = false
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {};
    
    // Adiciona o token de autenticação se disponível
    const token = Cookies.get('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Define o tipo de conteúdo com base no parâmetro useFormData
    if (!useFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Prepara o corpo da requisição com base no método e no uso de FormData
    let body: string | URLSearchParams | undefined;
    if (data) {
      if (useFormData) {
        // Para o login via OAuth2, precisamos usar application/x-www-form-urlencoded
        body = new URLSearchParams(data);
      } else {
        body = JSON.stringify(data);
      }
    }
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        credentials: 'include' // Inclui cookies nas requisições cross-origin
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || 'Ocorreu um erro na requisição');
      }
      
      return responseData;
    } catch (error: any) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      throw error;
    }
  }
  
  // Métodos de autenticação
  async register(data: RegisterPayload): Promise<ApiResponse<any>> {
    return this.request('/auth/sign-up', 'POST', data);
  }
  
  async login(data: LoginPayload): Promise<ApiResponse<{ access_token: string, token_type: string }>> {
    return this.request('/auth/sign-in', 'POST', data, true);
}
  
  async forgotPassword(data: ForgotPasswordPayload): Promise<ApiResponse<any>> {
    return this.request('/auth/forgot-password', 'POST', data);
  }
  
  async resetPassword(token: string, data: ResetPasswordPayload): Promise<ApiResponse<any>> {
    return this.request(`/auth/reset-password?token=${token}`, 'POST', data);
  }
  
  async logout(): Promise<ApiResponse<any>> {
    return this.request('/auth/logout', 'POST');
  }
  
  // Métodos para jogadores
  async getEvents(filters?: any): Promise<ApiResponse<any>> {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.request(`/player/events${queryParams}`);
  }
  
  async getNearbyEvents(location: { lat: number, lng: number }, radius?: number): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      radius: (radius || 10).toString()
    });
    return this.request(`/player/events/nearby?${queryParams.toString()}`);
  }
  
  async createEvent(eventData: any): Promise<ApiResponse<any>> {
    return this.request('/player/events', 'POST', eventData);
  }
  
  async joinEvent(eventId: string): Promise<ApiResponse<any>> {
    return this.request(`/player/events/${eventId}/join`, 'POST');
  }
  
  // Métodos para gerentes de espaços
  async getSpaces(): Promise<ApiResponse<any>> {
    return this.request('/manager/spaces');
  }
  
  async createSpace(spaceData: any): Promise<ApiResponse<any>> {
    return this.request('/manager/spaces', 'POST', spaceData);
  }
  
  async updateSpace(spaceId: string, spaceData: any): Promise<ApiResponse<any>> {
    return this.request(`/manager/spaces/${spaceId}`, 'PUT', spaceData);
  }
  
  async getReservations(spaceId: string): Promise<ApiResponse<any>> {
    return this.request(`/manager/spaces/${spaceId}/reservations`);
  }
  
  async approveReservation(reservationId: string): Promise<ApiResponse<any>> {
    return this.request(`/manager/reservations/${reservationId}/approve`, 'POST');
  }
  
  async rejectReservation(reservationId: string): Promise<ApiResponse<any>> {
    return this.request(`/manager/reservations/${reservationId}/reject`, 'POST');
  }
  
  // Métodos compartilhados
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/users/me');
  }
  
  async updateProfile(profileData: any): Promise<ApiResponse<any>> {
    return this.request('/users/me', 'PUT', profileData);
  }
  
  async getNotifications(params?: { 
    unread_only?: boolean, 
    page?: number, 
    per_page?: number 
  }): Promise<ApiResponse<any>> {
    const queryParams = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    return this.request(`/users/notifications${queryParams}`);
  }

  async markNotificationsAsRead(notificationIds: string[]): Promise<ApiResponse<any>> {
    return this.request('/users/notifications/mark-as-read', 'POST', {
      notification_ids: notificationIds
    });
  }
  
}



export const apiService = new ApiService();