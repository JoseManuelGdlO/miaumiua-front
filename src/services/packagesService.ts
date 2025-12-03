import { config } from '../config/environment';
import { authService } from './authService';

// Interfaces para Paquetes
export interface Package {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  descuento?: number;
  precio_final: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  productos?: Array<{
    id: number;
    fkid_paquete: number;
    fkid_producto: number;
    cantidad: number;
    producto?: {
      id: number;
      nombre: string;
      descripcion?: string;
      precio_venta?: number;
    };
  }>;
}

export interface CreatePackageData {
  nombre: string;
  descripcion?: string;
  precio: number;
  descuento?: number;
  productos?: Array<{
    fkid_producto: number;
    cantidad: number;
  }>;
}

export interface UpdatePackageData {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  descuento?: number;
  is_active?: boolean;
  productos?: Array<{
    fkid_producto: number;
    cantidad: number;
  }>;
}

export interface PackageResponse {
  success: boolean;
  data: {
    paquete: Package;
  };
}

export interface PackagesResponse {
  success: boolean;
  data: {
    paquetes: Package[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

const API_BASE_URL = config.apiBaseUrl;

class PackagesService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getAllPackages(params?: {
    page?: number;
    limit?: number;
    search?: string;
    activos?: string;
  }): Promise<PackagesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.activos) queryParams.append('activos', params.activos);

    const queryString = queryParams.toString();
    const endpoint = `/paquetes${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PackagesResponse>(endpoint);
  }

  async getPackageById(id: number): Promise<PackageResponse> {
    return this.request<PackageResponse>(`/paquetes/${id}`);
  }

  async createPackage(data: CreatePackageData): Promise<PackageResponse> {
    return this.request<PackageResponse>('/paquetes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePackage(id: number, data: UpdatePackageData): Promise<PackageResponse> {
    return this.request<PackageResponse>(`/paquetes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePackage(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/paquetes/${id}`, {
      method: 'DELETE',
    });
  }

  async togglePackageStatus(id: number, isActive: boolean): Promise<PackageResponse> {
    return this.request<PackageResponse>(`/paquetes/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  }
}

export const packagesService = new PackagesService();

