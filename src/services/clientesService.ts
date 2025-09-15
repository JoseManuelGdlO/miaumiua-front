import { config } from '@/config/environment';

// Interfaces
export interface Cliente {
  id: number;
  nombre_completo: string;
  correo_electronico: string;
  rol_id: number;
  ciudad_id: number;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  rol: {
    id: number;
    nombre: string;
    descripcion: string;
  };
  ciudad: {
    id: number;
    nombre: string;
    departamento: string;
  };
  totalPedidos: number;
  ultimoPedido?: string;
  totalGastado: number;
  loyaltyPoints: number;
}

export interface CreateClienteData {
  nombre_completo: string;
  correo_electronico: string;
  ciudad_id: number;
  contrasena?: string;
}

export interface UpdateClienteData {
  nombre_completo?: string;
  correo_electronico?: string;
  ciudad_id?: number;
  contrasena?: string;
}

export interface ClienteResponse {
  success: boolean;
  data: {
    cliente: Cliente;
  };
  message?: string;
}

export interface ClientesResponse {
  success: boolean;
  data: {
    clientes: Cliente[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface ClienteStatsResponse {
  success: boolean;
  data: {
    totalClientes: number;
    clientesActivos: number;
    clientesInactivos: number;
    clientesByCiudad: Array<{
      ciudad_id: number;
      count: number;
      ciudad: {
        nombre: string;
        departamento: string;
      };
    }>;
  };
}

export interface ActiveClientesResponse {
  success: boolean;
  data: {
    clientes: Cliente[];
    total: number;
  };
}

// Parámetros de consulta
export interface ClientesQueryParams {
  activos?: 'true' | 'false';
  ciudad_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

class ClientesService {
  private baseUrl = `${config.apiBaseUrl}/clientes`;

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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Obtener todos los clientes
  async getAllClientes(params: ClientesQueryParams = {}): Promise<ClientesResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}?${searchParams.toString()}`;
    return this.makeRequest<ClientesResponse>(url);
  }

  // Obtener un cliente por ID
  async getClienteById(id: number): Promise<ClienteResponse> {
    return this.makeRequest<ClienteResponse>(`${this.baseUrl}/${id}`);
  }

  // Crear nuevo cliente
  async createCliente(data: CreateClienteData): Promise<ClienteResponse> {
    return this.makeRequest<ClienteResponse>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Actualizar cliente
  async updateCliente(id: number, data: UpdateClienteData): Promise<ClienteResponse> {
    return this.makeRequest<ClienteResponse>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Eliminar cliente (baja lógica)
  async deleteCliente(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  // Restaurar cliente
  async restoreCliente(id: number): Promise<ClienteResponse> {
    return this.makeRequest<ClienteResponse>(`${this.baseUrl}/${id}/restore`, {
      method: 'PATCH',
    });
  }

  // Obtener estadísticas de clientes
  async getClienteStats(): Promise<ClienteStatsResponse> {
    return this.makeRequest<ClienteStatsResponse>(`${this.baseUrl}/stats`);
  }

  // Obtener clientes activos
  async getActiveClientes(): Promise<ActiveClientesResponse> {
    return this.makeRequest<ActiveClientesResponse>(`${this.baseUrl}/active`);
  }
}

export const clientesService = new ClientesService();
export default clientesService;
