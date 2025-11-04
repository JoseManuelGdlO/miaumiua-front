import { config } from '../config/environment';
import { City } from './citiesService';

// Interfaces para Promociones
export interface Promotion {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  tipo_promocion: 'porcentaje' | 'monto_fijo' | 'envio_gratis' | 'descuento_especial';
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  limite_uso: number;
  compra_minima?: number;
  descuento_maximo?: number;
  baja_logica: boolean;
  created_at: string;
  updated_at: string;
  ciudades?: City[];
}


export interface CreatePromotionData {
  nombre: string;
  codigo: string;
  descripcion?: string;
  tipo_promocion: 'porcentaje' | 'monto_fijo' | 'envio_gratis' | 'descuento_especial';
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  limite_uso: number;
  compra_minima?: number;
  descuento_maximo?: number;
  ciudades?: number[];
}

export interface UpdatePromotionData {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  tipo_promocion?: 'porcentaje' | 'monto_fijo' | 'envio_gratis' | 'descuento_especial';
  valor_descuento?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  limite_uso?: number;
  compra_minima?: number;
  descuento_maximo?: number;
  ciudades?: number[];
}

export interface PromotionsResponse {
  success: boolean;
  data: {
    promotions: Promotion[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface PromotionResponse {
  success: boolean;
  data: {
    promotion: Promotion;
  };
}

export interface PromotionStatsResponse {
  success: boolean;
  data: {
    total_promotions: number;
    active_promotions: number;
    expired_promotions: number;
    promotions_by_type: Array<{
      tipo_promocion: string;
      total: number;
    }>;
  };
}

export interface PromotionsQueryParams {
  page?: number;
  limit?: number;
  tipo_promocion?: string;
  activos?: 'true' | 'false';
  include_cities?: 'true' | 'false';
  search?: string;
}

class PromotionsService {
  private makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de acceso requerido');
    }

    const requestConfig: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    return fetch(`${config.apiBaseUrl}${endpoint}`, requestConfig)
      .then(async response => {
        if (!response.ok) {
          // Manejar errores de autenticación (401/403) y desloguear automáticamente
          const { authService } = await import('./authService');
          authService.handleAuthError(response);
          
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      });
  }

  async getAllPromotions(params: PromotionsQueryParams = {}): Promise<PromotionsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.tipo_promocion) queryParams.append('tipo_promocion', params.tipo_promocion);
    if (params.activos) queryParams.append('activos', params.activos);
    if (params.include_cities) queryParams.append('include_cities', params.include_cities);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/promotions${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<PromotionsResponse>(endpoint);
  }

  async getPromotionById(id: number): Promise<PromotionResponse> {
    return this.makeRequest<PromotionResponse>(`/promotions/${id}`);
  }

  async createPromotion(data: CreatePromotionData): Promise<PromotionResponse> {
    return this.makeRequest<PromotionResponse>('/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePromotion(id: number, data: UpdatePromotionData): Promise<PromotionResponse> {
    return this.makeRequest<PromotionResponse>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePromotion(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/promotions/${id}`, {
      method: 'DELETE',
    });
  }

  async restorePromotion(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/promotions/${id}/restore`, {
      method: 'PATCH',
    });
  }

  async getPromotionStats(): Promise<PromotionStatsResponse> {
    return this.makeRequest<PromotionStatsResponse>('/promotions/stats');
  }

  async getActivePromotions(): Promise<PromotionsResponse> {
    return this.makeRequest<PromotionsResponse>('/promotions/active');
  }
}

export const promotionsService = new PromotionsService();
