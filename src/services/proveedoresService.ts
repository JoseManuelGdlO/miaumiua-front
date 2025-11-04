import { config } from '../config/environment';

// Interfaces para Proveedores
export interface Proveedor {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  descripcion?: string;
  baja_logica: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProveedorData {
  nombre: string;
  correo: string;
  telefono: string;
  descripcion?: string;
}

export interface UpdateProveedorData {
  nombre?: string;
  correo?: string;
  telefono?: string;
  descripcion?: string;
}

export interface ProveedoresResponse {
  success: boolean;
  data: {
    proveedores: Proveedor[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ProveedorResponse {
  success: boolean;
  data: {
    proveedor: Proveedor;
  };
}

export interface ProveedoresQueryParams {
  page?: number;
  limit?: number;
  activos?: 'true' | 'false';
  search?: string;
}

export interface ProveedorStatsResponse {
  success: boolean;
  data: {
    totalProveedores: number;
    proveedoresActivos: number;
    proveedoresInactivos: number;
  };
}

class ProveedoresService {
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

  async getAllProveedores(params: ProveedoresQueryParams = {}): Promise<ProveedoresResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.activos) queryParams.append('activos', params.activos);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/proveedores${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<ProveedoresResponse>(endpoint);
  }

  async getProveedorById(id: number): Promise<ProveedorResponse> {
    return this.makeRequest<ProveedorResponse>(`/proveedores/${id}`);
  }

  async createProveedor(data: CreateProveedorData): Promise<ProveedorResponse> {
    return this.makeRequest<ProveedorResponse>('/proveedores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProveedor(id: number, data: UpdateProveedorData): Promise<ProveedorResponse> {
    return this.makeRequest<ProveedorResponse>(`/proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProveedor(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/proveedores/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreProveedor(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/proveedores/${id}/restore`, {
      method: 'PATCH',
    });
  }

  async getProveedorStats(): Promise<ProveedorStatsResponse> {
    return this.makeRequest<ProveedorStatsResponse>('/proveedores/stats');
  }
}

export const proveedoresService = new ProveedoresService();
