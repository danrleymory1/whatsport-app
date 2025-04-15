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
    
    // Get token from both cookie and localStorage as fallback
    const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
    
    const headers: HeadersInit = {};
    
    // Always include token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`Using token for ${endpoint}: ${token.substring(0, 15)}...`);
    } else {
      console.warn(`No token available for ${endpoint}`);
    }
    
    // Define content type
    if (!useFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Prepare request body
    let body: string | URLSearchParams | undefined;
    if (data) {
      if (useFormData) {
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
        credentials: 'include',
        mode: 'cors'
      });
      
      // Handle empty responses
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }
      
      // Parse response
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        throw new Error("Invalid response format");
      }
      
      if (!response.ok) {
        console.error(`API Error (${method} ${endpoint}):`, responseData);
        throw new Error(responseData.detail || responseData.message || 'Request error');
      }
      
      return responseData;
    } catch (error: any) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  private normalizeEventsResponse(response: any): { events: any[], total: number, page: number, per_page: number } {
    // Se a resposta já estiver no formato esperado
    if (response && response.events !== undefined && Array.isArray(response.events)) {
      return {
        events: response.events,
        total: response.total || response.events.length,
        page: response.page || 1,
        per_page: response.per_page || 10
      };
    }
    
    // Se a resposta for diretamente um array de eventos
    if (response && Array.isArray(response)) {
      return {
        events: response,
        total: response.length,
        page: 1,
        per_page: response.length
      };
    }
    
    // Se a resposta estiver em algum outro formato, tenta encontrar a lista de eventos
    if (response && typeof response === 'object') {
      // Procura por uma propriedade que seja um array
      for (const key in response) {
        if (Array.isArray(response[key])) {
          return {
            events: response[key],
            total: response.total || response[key].length,
            page: response.page || 1,
            per_page: response.per_page || 10
          };
        }
      }
    }
    
    // Se nada for encontrado, retorna uma lista vazia
    return {
      events: [],
      total: 0,
      page: 1,
      per_page: 10
    };
  }

  // Métodos de autenticação
  async register(data: RegisterPayload): Promise<ApiResponse<any>> {
    return this.request('/auth/sign-up', 'POST', data);
  }
  
  async login(data: LoginPayload): Promise<any> {
    try {
      const url = `${API_BASE_URL}/auth/sign-in`;
      
      // Create form data for OAuth2
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao fazer login');
      }
      
      const responseData = await response.json();
      console.log('Login API response:', responseData);
      
      return responseData;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
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
  
  async getEvents(filters?: any): Promise<ApiResponse<any>> {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    try {
      const response = await this.request<{data?: any}>(`/player/events${queryParams}`);
      return { 
        data: this.normalizeEventsResponse(response.data || response as any)
      };
    } catch (error) {
      console.error("Error fetching events:", error);
      return { 
        data: this.normalizeEventsResponse([]),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async getNearbyEvents(location: { lat: number, lng: number }, radius?: number): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams({
        lat: location.lat.toString(),
        lng: location.lng.toString(),
        radius: (radius || 10).toString()
      });
      
      const response = await this.request<{data?: any}>(`/player/events/nearby?${queryParams.toString()}`);
      return { 
        data: this.normalizeEventsResponse(response.data || response as any)
      };
    } catch (error) {
      console.error("API Error fetching nearby events:", error);
      return { 
        data: this.normalizeEventsResponse([]),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createEvent(eventData: any): Promise<ApiResponse<any>> {
    return this.request('/player/events', 'POST', eventData);
  }

  
  async joinEvent(eventId: string): Promise<ApiResponse<any>> {
    return this.request(`/player/events/${eventId}/join`, 'POST');
  }
  
  async getReservations(filters?: any): Promise<ApiResponse<any>> {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.request(`/player/reservations${queryParams}`);
  }
  
  async getReservation(reservationId: string): Promise<ApiResponse<any>> {
    return this.request(`/player/reservations/${reservationId}`);
  }
  
  async createReservation(reservationData: any): Promise<ApiResponse<any>> {
    return this.request('/player/reservations', 'POST', reservationData);
  }
  
  async cancelReservation(reservationId: string): Promise<ApiResponse<any>> {
    return this.request(`/player/reservations/${reservationId}/cancel`, 'POST');
  }
  
  // Métodos para Espaços
  async getPublicSpaces(filters?: any): Promise<ApiResponse<any>> {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.request(`/manager/spaces/public${queryParams}`);
  }
  
  async getSpace(spaceId: string): Promise<ApiResponse<any>> {
    return this.request(`/manager/spaces/${spaceId}`);
  }

  // Métodos para gerentes de espaços
  async getSpaces(): Promise<ApiResponse<any>> {
    return this.request('/manager/spaces');
  }

  // Métodos para gerenciamento de espaços
async createSpace(spaceData: any): Promise<ApiResponse<any>> {
  return this.request('/manager/spaces', 'POST', spaceData);
}

async updateSpace(spaceId: string, spaceData: any): Promise<ApiResponse<any>> {
  return this.request(`/manager/spaces/${spaceId}`, 'PUT', spaceData);
}

async deleteSpace(spaceId: string): Promise<ApiResponse<any>> {
  return this.request(`/manager/spaces/${spaceId}`, 'DELETE');
}

async addSpacePhoto(spaceId: string, photoData: { url: string, is_primary: boolean }): Promise<ApiResponse<any>> {
  return this.request(`/manager/spaces/${spaceId}/photos`, 'POST', photoData);
}

async removeSpacePhoto(spaceId: string, photoId: string): Promise<ApiResponse<any>> {
  return this.request(`/manager/spaces/${spaceId}/photos/${photoId}`, 'DELETE');
}

async getSpaceReservations(spaceId: string, filters?: any): Promise<ApiResponse<any>> {
  const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return this.request(`/manager/reservations/space/${spaceId}${queryParams}`);
}

async approveReservation(reservationId: string): Promise<ApiResponse<any>> {
  return this.request(`/manager/reservations/${reservationId}/approve`, 'POST');
}

async rejectReservation(reservationId: string, data: { rejection_reason: string }): Promise<ApiResponse<any>> {
  return this.request(`/manager/reservations/${reservationId}/reject`, 'POST', data);
}

async completeReservation(reservationId: string): Promise<ApiResponse<any>> {
  return this.request(`/manager/reservations/${reservationId}/complete`, 'POST');
}
  
  async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const url = `${API_BASE_URL}/users/me`;
      
      // Get the token from cookies
      const token = Cookies.get('accessToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Authentication failed');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get user data');
      }
      
      const responseData = await response.json();
      console.log('User data response:', responseData);
      
      return { data: responseData };
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
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