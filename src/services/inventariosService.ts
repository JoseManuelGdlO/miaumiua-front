import { config } from '../config/environment';

// Interfaces para Inventarios
export interface Inventario {
  id: number;
  sku: string;
  nombre: string;
  descripcion?: string;
  stock_inicial: number;
  stock_minimo: number;
  stock_maximo: number;
  precio_venta: number;
  costo_unitario: number;
  fkid_peso: number;
  fkid_categoria: number;
  fkid_ciudad: number;
  fkid_proveedor: number;
  baja_logica: boolean;
  created_at: string;
  updated_at: string;
  peso?: Peso;
  categoria?: CategoriaProducto;
  ciudad?: City;
  proveedor?: Proveedor;
}

export interface Peso {
  id: number;
  cantidad: string;
  unidad_medida: string;
  baja_logica: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriaProducto {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface City {
  id: number;
  nombre: string;
  departamento: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
}

export interface CreateInventarioData {
  sku: string;
  nombre: string;
  descripcion?: string;
  stock_inicial: number;
  stock_minimo: number;
  stock_maximo: number;
  precio_venta: number;
  costo_unitario: number;
  fkid_peso: number;
  fkid_categoria: number;
  fkid_ciudad: number;
  fkid_proveedor: number;
}

export interface UpdateInventarioData {
  sku?: string;
  nombre?: string;
  descripcion?: string;
  stock_inicial?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  precio_venta?: number;
  costo_unitario?: number;
  fkid_peso?: number;
  fkid_categoria?: number;
  fkid_ciudad?: number;
  fkid_proveedor?: number;
}

export interface InventariosResponse {
  success: boolean;
  data: {
    inventarios: Inventario[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface InventarioResponse {
  success: boolean;
  data: {
    inventario: Inventario;
  };
}

export interface InventarioStatsResponse {
  success: boolean;
  data: {
    total_inventarios: number;
    active_inventarios: number;
    low_stock_inventarios: number;
    total_value: number;
    inventarios_by_category: Array<{
      categoria: string;
      total: number;
    }>;
  };
}

export interface InventariosQueryParams {
  page?: number;
  limit?: number;
  categoria?: string;
  ciudad?: string;
  proveedor?: string;
  peso?: string;
  activos?: 'true' | 'false';
  low_stock?: 'true' | 'false';
  search?: string;
  min_price?: number;
  max_price?: number;
}

class InventariosService {
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

  async getAllInventarios(params: InventariosQueryParams = {}): Promise<InventariosResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.categoria) queryParams.append('categoria', params.categoria);
    if (params.ciudad) queryParams.append('ciudad', params.ciudad);
    if (params.proveedor) queryParams.append('proveedor', params.proveedor);
    if (params.peso) queryParams.append('peso', params.peso);
    if (params.activos) queryParams.append('activos', params.activos);
    if (params.low_stock) queryParams.append('low_stock', params.low_stock);
    if (params.search) queryParams.append('search', params.search);
    if (params.min_price) queryParams.append('min_price', params.min_price.toString());
    if (params.max_price) queryParams.append('max_price', params.max_price.toString());

    const queryString = queryParams.toString();
    const endpoint = `/inventarios${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<InventariosResponse>(endpoint);
  }

  async getInventarioById(id: number): Promise<InventarioResponse> {
    return this.makeRequest<InventarioResponse>(`/inventarios/${id}`);
  }

  async createInventario(data: CreateInventarioData): Promise<InventarioResponse> {
    return this.makeRequest<InventarioResponse>('/inventarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventario(id: number, data: UpdateInventarioData): Promise<InventarioResponse> {
    return this.makeRequest<InventarioResponse>(`/inventarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInventario(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/inventarios/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreInventario(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/inventarios/${id}/restore`, {
      method: 'PATCH',
    });
  }

  async getInventarioStats(): Promise<InventarioStatsResponse> {
    return this.makeRequest<InventarioStatsResponse>('/inventarios/stats');
  }

  async getActiveInventarios(): Promise<InventariosResponse> {
    return this.makeRequest<InventariosResponse>('/inventarios/active');
  }
}

export const inventariosService = new InventariosService();
