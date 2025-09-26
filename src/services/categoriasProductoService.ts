import { config } from '../config/environment';

// Tipos para las categorías de producto
export interface CategoriaProducto {
  id: number;
  nombre: string;
  descripcion?: string;
  baja_logica: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoriaProductoData {
  nombre: string;
  descripcion?: string;
}

export interface UpdateCategoriaProductoData {
  nombre?: string;
  descripcion?: string;
}

export interface CategoriasProductoResponse {
  success: boolean;
  data: {
    categorias: CategoriaProducto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface CategoriaProductoResponse {
  success: boolean;
  data: CategoriaProducto;
}

export interface CategoriaProductoStatsResponse {
  success: boolean;
  data: {
    totalCategorias: number;
    categoriasActivas: number;
    categoriasInactivas: number;
    categoriasConDescripcion: number;
    categoriasSinDescripcion: number;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Clase para manejar las categorías de producto
class CategoriasProductoService {
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
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      });
  }

  // Obtener todas las categorías de producto
  async getAllCategorias(params?: {
    activos?: 'true' | 'false';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CategoriasProductoResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.activos) queryParams.append('activos', params.activos);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `/categorias-producto${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return this.makeRequest<CategoriasProductoResponse>(endpoint);
    } catch (error) {
      console.error('Error al obtener categorías de producto:', error);
      throw error;
    }
  }

  // Obtener categorías activas
  async getActiveCategorias(): Promise<CategoriasProductoResponse> {
    try {
      return this.makeRequest<CategoriasProductoResponse>('/categorias-producto/active');
    } catch (error) {
      console.error('Error al obtener categorías activas:', error);
      throw error;
    }
  }

  // Obtener estadísticas de categorías
  async getCategoriaStats(): Promise<CategoriaProductoStatsResponse> {
    try {
      return this.makeRequest<CategoriaProductoStatsResponse>('/categorias-producto/stats');
    } catch (error) {
      console.error('Error al obtener estadísticas de categorías:', error);
      throw error;
    }
  }

  // Obtener una categoría por ID
  async getCategoriaById(id: number): Promise<CategoriaProductoResponse> {
    try {
      return this.makeRequest<CategoriaProductoResponse>(`/categorias-producto/${id}`);
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      throw error;
    }
  }

  // Crear una nueva categoría
  async createCategoria(data: CreateCategoriaProductoData): Promise<CategoriaProductoResponse> {
    try {
      return this.makeRequest<CategoriaProductoResponse>('/categorias-producto', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  }

  // Actualizar una categoría
  async updateCategoria(id: number, data: UpdateCategoriaProductoData): Promise<CategoriaProductoResponse> {
    try {
      return this.makeRequest<CategoriaProductoResponse>(`/categorias-producto/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      throw error;
    }
  }

  // Eliminar una categoría (baja lógica)
  async deleteCategoria(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return this.makeRequest<{ success: boolean; message: string }>(`/categorias-producto/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      throw error;
    }
  }

  // Restaurar una categoría
  async restoreCategoria(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return this.makeRequest<{ success: boolean; message: string }>(`/categorias-producto/${id}/restore`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Error al restaurar categoría:', error);
      throw error;
    }
  }

  // Buscar categorías
  async searchCategorias(search: string): Promise<CategoriasProductoResponse> {
    try {
      return this.makeRequest<CategoriasProductoResponse>(`/categorias-producto/search?search=${encodeURIComponent(search)}`);
    } catch (error) {
      console.error('Error al buscar categorías:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de categorías de producto
export const categoriasProductoService = new CategoriasProductoService();
