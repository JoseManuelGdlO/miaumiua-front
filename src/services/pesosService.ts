import { authService } from './authService';

// Tipos para los pesos
export interface Peso {
  id: number;
  cantidad: number;
  unidad_medida: 'kg' | 'g' | 'lb' | 'oz' | 'ton';
  baja_logica: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePesoData {
  cantidad: number;
  unidad_medida: 'kg' | 'g' | 'lb' | 'oz' | 'ton';
}

export interface UpdatePesoData {
  cantidad?: number;
  unidad_medida?: 'kg' | 'g' | 'lb' | 'oz' | 'ton';
}

export interface PesosResponse {
  success: boolean;
  data: {
    pesos: Peso[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface PesoResponse {
  success: boolean;
  data: Peso;
}

export interface PesoStatsResponse {
  success: boolean;
  data: {
    totalPesos: number;
    pesosByUnidad: Array<{
      unidad_medida: string;
      count: number;
    }>;
    minCantidad: number;
    maxCantidad: number;
    averageCantidad: number;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Clase para manejar los pesos
class PesosService {
  // Obtener todos los pesos
  async getAllPesos(params?: {
    unidad_medida?: 'kg' | 'g' | 'lb' | 'oz' | 'ton';
    activos?: 'true' | 'false';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PesosResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.unidad_medida) queryParams.append('unidad_medida', params.unidad_medida);
      if (params?.activos) queryParams.append('activos', params.activos);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `/pesos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await authService.authenticatedRequest<PesosResponse>(endpoint);
    } catch (error) {
      console.error('Error al obtener pesos:', error);
      throw error;
    }
  }

  // Obtener pesos activos
  async getActivePesos(): Promise<PesosResponse> {
    try {
      return await authService.authenticatedRequest<PesosResponse>('/pesos/active');
    } catch (error) {
      console.error('Error al obtener pesos activos:', error);
      throw error;
    }
  }

  // Obtener estadísticas de pesos
  async getPesoStats(): Promise<PesoStatsResponse> {
    try {
      return await authService.authenticatedRequest<PesoStatsResponse>('/pesos/stats');
    } catch (error) {
      console.error('Error al obtener estadísticas de pesos:', error);
      throw error;
    }
  }

  // Obtener un peso por ID
  async getPesoById(id: number): Promise<PesoResponse> {
    try {
      return await authService.authenticatedRequest<PesoResponse>(`/pesos/${id}`);
    } catch (error) {
      console.error('Error al obtener peso:', error);
      throw error;
    }
  }

  // Crear un nuevo peso
  async createPeso(data: CreatePesoData): Promise<PesoResponse> {
    try {
      return await authService.authenticatedRequest<PesoResponse>('/pesos', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al crear peso:', error);
      throw error;
    }
  }

  // Actualizar un peso
  async updatePeso(id: number, data: UpdatePesoData): Promise<PesoResponse> {
    try {
      return await authService.authenticatedRequest<PesoResponse>(`/pesos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al actualizar peso:', error);
      throw error;
    }
  }

  // Eliminar un peso (baja lógica)
  async deletePeso(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/pesos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error al eliminar peso:', error);
      throw error;
    }
  }

  // Restaurar un peso
  async restorePeso(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/pesos/${id}/restore`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Error al restaurar peso:', error);
      throw error;
    }
  }

  // Obtener pesos por unidad de medida
  async getPesosByUnidad(unidad: 'kg' | 'g' | 'lb' | 'oz' | 'ton'): Promise<PesosResponse> {
    try {
      return await authService.authenticatedRequest<PesosResponse>(`/pesos/unidad/${unidad}`);
    } catch (error) {
      console.error('Error al obtener pesos por unidad:', error);
      throw error;
    }
  }

  // Obtener pesos por rango
  async getPesosByRange(min: number, max: number, unidad?: 'kg' | 'g' | 'lb' | 'oz' | 'ton'): Promise<PesosResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('min', min.toString());
      queryParams.append('max', max.toString());
      if (unidad) queryParams.append('unidad', unidad);

      return await authService.authenticatedRequest<PesosResponse>(`/pesos/range?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error al obtener pesos por rango:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de pesos
export const pesosService = new PesosService();
