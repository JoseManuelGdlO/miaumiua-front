import { config } from '@/config/environment';

// Horario por día: claves "0" (domingo) a "6" (sábado), horas 0-23, inicio < fin
export interface HorarioSlot {
  inicio: number;
  fin: number;
}

export type HorarioPorDia = Record<string, HorarioSlot>;

export const HORARIO_POR_DIA_DEFAULT: HorarioPorDia = {
  '0': { inicio: 9, fin: 18 },
  '1': { inicio: 9, fin: 18 },
  '2': { inicio: 9, fin: 18 },
  '3': { inicio: 9, fin: 18 },
  '4': { inicio: 9, fin: 18 },
  '5': { inicio: 9, fin: 18 },
  '6': { inicio: 9, fin: 14 },
};

// Tipos para las ciudades
export interface City {
  id: number;
  nombre: string;
  departamento: string;
  direccion_operaciones: string;
  estado_inicial: 'activa' | 'inactiva' | 'en_construccion' | 'mantenimiento' | 'suspendida';
  numero_zonas_entrega: number;
  area_cobertura: string;
  tiempo_promedio_entrega: number;
  horario_atencion: string;
  manager: string;
  telefono: string;
  email_contacto: string;
  notas_adicionales: string;
  max_pedidos_por_horario?: number;
  horario_por_dia?: HorarioPorDia;
  dias_trabajo?: number[];
  hora_inicio_entrega?: number;
  hora_fin_entrega?: number;
  baja_logica: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCityData {
  nombre: string;
  departamento: string;
  direccion_operaciones: string;
  estado_inicial?: 'activa' | 'inactiva' | 'en_construccion' | 'mantenimiento' | 'suspendida';
  numero_zonas_entrega?: number;
  area_cobertura?: string;
  tiempo_promedio_entrega?: number;
  horario_atencion?: string;
  manager: string;
  telefono: string;
  email_contacto: string;
  notas_adicionales?: string;
  max_pedidos_por_horario?: number;
  dias_trabajo?: number[];
  horario_por_dia?: HorarioPorDia;
}

export interface UpdateCityData {
  nombre?: string;
  departamento?: string;
  direccion_operaciones?: string;
  estado_inicial?: 'activa' | 'inactiva' | 'en_construccion' | 'mantenimiento' | 'suspendida';
  numero_zonas_entrega?: number;
  area_cobertura?: string;
  tiempo_promedio_entrega?: number;
  horario_atencion?: string;
  manager?: string;
  telefono?: string;
  email_contacto?: string;
  notas_adicionales?: string;
  max_pedidos_por_horario?: number;
  dias_trabajo?: number[];
  horario_por_dia?: HorarioPorDia;
}

export interface CitiesResponse {
  success: boolean;
  data: {
    cities: City[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface CityResponse {
  success: boolean;
  data: {
    city: City;
  };
  message?: string;
}

export interface CityStatsResponse {
  success: boolean;
  data: {
    totalCities: number;
    citiesActivas: number;
    citiesInactivas: number;
    citiesByEstado: Array<{
      estado_inicial: string;
      count: number;
    }>;
  };
}

// Parámetros de consulta
export interface CitiesQueryParams {
  activos?: 'true' | 'false';
  estado_inicial?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Clase para manejar las ciudades
class CitiesService {
  private baseUrl = `${config.apiBaseUrl}/cities`;

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    const requestConfig: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, requestConfig);
    
    if (!response.ok) {
      // Manejar errores de autenticación (401/403) y desloguear automáticamente
      const { authService } = await import('./authService');
      authService.handleAuthError(response);
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Obtener todas las ciudades
  async getAllCities(params: CitiesQueryParams = {}): Promise<CitiesResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}?${searchParams.toString()}`;
    return this.makeRequest<CitiesResponse>(url);
  }

  // Obtener una ciudad por ID
  async getCityById(id: number): Promise<CityResponse> {
    return this.makeRequest<CityResponse>(`${this.baseUrl}/${id}`);
  }

  // Crear una nueva ciudad
  async createCity(data: CreateCityData): Promise<CityResponse> {
    return this.makeRequest<CityResponse>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Actualizar una ciudad
  async updateCity(id: number, data: UpdateCityData): Promise<CityResponse> {
    return this.makeRequest<CityResponse>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Eliminar una ciudad (baja lógica)
  async deleteCity(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  // Restaurar una ciudad
  async restoreCity(id: number): Promise<CityResponse> {
    return this.makeRequest<CityResponse>(`${this.baseUrl}/${id}/restore`, {
      method: 'PATCH',
    });
  }

  // Obtener estadísticas de ciudades
  async getCityStats(): Promise<CityStatsResponse> {
    return this.makeRequest<CityStatsResponse>(`${this.baseUrl}/stats`);
  }

  // Obtener ciudades activas
  async getActiveCities(): Promise<{ success: boolean; data: { cities: City[]; total: number } }> {
    return this.makeRequest<{ success: boolean; data: { cities: City[]; total: number } }>(`${this.baseUrl}/active`);
  }
}

// Instancia singleton del servicio de ciudades
export const citiesService = new CitiesService();
