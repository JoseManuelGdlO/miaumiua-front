import { config } from '../config/environment';
import { authService } from './authService';

// Interfaces para Pedidos
export interface Order {
  id: number;
  numero_pedido: string;
  fkid_cliente: number;
  telefono_referencia?: string;
  email_referencia?: string;
  direccion_entrega: string;
  fkid_ciudad: number;
  fecha_entrega_estimada?: string;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'pago_movil';
  notas?: string;
  estado: 'pendiente' | 'confirmado' | 'en_preparacion' | 'en_camino' | 'entregado' | 'cancelado';
  subtotal: number;
  descuento_total: number;
  total: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  cliente?: {
    id: number;
    nombre_completo: string;
    telefono: string;
    email?: string;
  };
  ciudad?: {
    id: number;
    nombre: string;
    departamento: string;
  };
  productos?: Array<{
    id: number;
    fkid_pedido: number;
    fkid_producto: number;
    cantidad: number;
    precio_unidad: number;
    descuento_producto: number;
    subtotal_producto: number;
    notas_producto?: string;
    producto?: {
      id: number;
      nombre: string;
      descripcion?: string;
    };
  }>;
  paquetes?: Array<{
    id: number;
    fkid_pedido: number;
    fkid_paquete: number;
    cantidad: number;
    precio_unidad: number;
    precio_total: number;
    descuento_paquete: number;
    notas_paquete?: string;
    paquete?: {
      id: number;
      nombre: string;
      descripcion?: string;
      precio_final: number;
    };
  }>;
}

export interface CreateOrderData {
  fkid_cliente: number;
  telefono_referencia?: string;
  email_referencia?: string;
  direccion_entrega: string;
  fkid_ciudad: number;
  fecha_entrega_estimada?: string;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'pago_movil';
  notas?: string;
  codigo_promocion?: string;
  productos?: Array<{
    fkid_producto: number;
    cantidad: number;
    precio_unidad: number;
    descuento_producto?: number;
    notas_producto?: string;
  }>;
  paquetes?: Array<{
    fkid_paquete: number;
    cantidad: number;
    precio_unidad?: number;
    descuento_paquete?: number;
    notas_paquete?: string;
  }>;
}

export interface UpdateOrderData {
  fkid_cliente?: number;
  telefono_referencia?: string;
  email_referencia?: string;
  direccion_entrega?: string;
  fkid_ciudad?: number;
  fecha_entrega_estimada?: string;
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'pago_movil';
  notas?: string;
  productos?: Array<{
    id?: number;
    fkid_producto: number;
    cantidad: number;
    precio_unidad: number;
    descuento_producto?: number;
    notas_producto?: string;
  }>;
  paquetes?: Array<{
    id?: number;
    fkid_paquete: number;
    cantidad: number;
    precio_unidad?: number;
    descuento_paquete?: number;
    notas_paquete?: string;
  }>;
}

export interface OrderResponse {
  success: boolean;
  data: {
    pedido: Order;
  };
}

export interface OrdersResponse {
  success: boolean;
  data: {
    pedidos: Order[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface OrderStatsResponse {
  success: boolean;
  data: {
    total_pedidos: number;
    pedidos_pendientes: number;
    pedidos_confirmados: number;
    pedidos_en_preparacion: number;
    pedidos_en_camino: number;
    pedidos_entregados: number;
    pedidos_cancelados: number;
    total_ventas: number;
    ventas_mes_actual: number;
    ventas_mes_anterior: number;
    crecimiento_ventas: number;
    promedio_pedido: number;
    metodo_pago_stats: Array<{
      metodo_pago: string;
      total: number;
      porcentaje: number;
    }>;
    estado_stats: Array<{
      estado: string;
      total: number;
      porcentaje: number;
    }>;
  };
}

export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  fkid_cliente?: number;
  fkid_ciudad?: number;
  estado?: 'pendiente' | 'confirmado' | 'en_preparacion' | 'en_camino' | 'entregado' | 'cancelado';
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'pago_movil';
  activos?: 'true' | 'false';
  search?: string;
  start_date?: string;
  end_date?: string;
}

class OrdersService {
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
          authService.handleAuthError(response);
          
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      });
  }

  // Obtener todos los pedidos
  async getAllOrders(params: OrdersQueryParams = {}): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.fkid_cliente) queryParams.append('fkid_cliente', params.fkid_cliente.toString());
    if (params.fkid_ciudad) queryParams.append('fkid_ciudad', params.fkid_ciudad.toString());
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.metodo_pago) queryParams.append('metodo_pago', params.metodo_pago);
    if (params.activos) queryParams.append('activos', params.activos);
    if (params.search) queryParams.append('search', params.search);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    // Incluir información relacionada
    queryParams.append('include_cliente', 'true');
    queryParams.append('include_ciudad', 'true');
    queryParams.append('include_productos', 'true');

    const queryString = queryParams.toString();
    const endpoint = `/pedidos${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<OrdersResponse>(endpoint);
  }

  // Obtener pedido por ID
  async getOrderById(id: number): Promise<OrderResponse> {
    return this.makeRequest<OrderResponse>(`/pedidos/${id}?include_cliente=true&include_ciudad=true&include_productos=true`);
  }

  // Crear nuevo pedido
  async createOrder(data: CreateOrderData): Promise<OrderResponse> {
    return this.makeRequest<OrderResponse>('/pedidos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Actualizar pedido
  async updateOrder(id: number, data: UpdateOrderData): Promise<OrderResponse> {
    return this.makeRequest<OrderResponse>(`/pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Eliminar pedido (baja lógica)
  async deleteOrder(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/pedidos/${id}`, {
      method: 'DELETE',
    });
  }

  // Restaurar pedido
  async restoreOrder(id: number): Promise<OrderResponse> {
    return this.makeRequest<OrderResponse>(`/pedidos/${id}/restore`, {
      method: 'PATCH',
    });
  }

  // Obtener estadísticas de pedidos
  async getOrderStats(): Promise<OrderStatsResponse> {
    return this.makeRequest<OrderStatsResponse>('/pedidos/stats');
  }

  // Obtener pedidos recientes
  async getRecentOrders(limit: number = 10): Promise<OrdersResponse> {
    return this.makeRequest<OrdersResponse>(`/pedidos/recent?limit=${limit}`);
  }

  // Obtener pedidos pendientes
  async getPendingOrders(): Promise<OrdersResponse> {
    return this.makeRequest<OrdersResponse>('/pedidos/pendientes');
  }

  // Obtener pedidos en preparación
  async getOrdersInPreparation(): Promise<OrdersResponse> {
    return this.makeRequest<OrdersResponse>('/pedidos/en-preparacion');
  }

  // Obtener pedidos en camino
  async getOrdersInTransit(): Promise<OrdersResponse> {
    return this.makeRequest<OrdersResponse>('/pedidos/en-camino');
  }

  // Obtener pedidos por cliente
  async getOrdersByClient(clientId: number): Promise<OrdersResponse> {
    return this.makeRequest<OrdersResponse>(`/pedidos/cliente/${clientId}`);
  }

  // Obtener pedidos por estado
  async getOrdersByStatus(status: string): Promise<OrdersResponse> {
    return this.makeRequest<OrdersResponse>(`/pedidos/estado/${status}`);
  }

  // Obtener pedidos por ciudad
  async getOrdersByCity(cityId: number): Promise<OrdersResponse> {
    return this.makeRequest<OrdersResponse>(`/pedidos/ciudad/${cityId}`);
  }

  // Buscar pedido por número
  async getOrderByNumber(number: string): Promise<OrderResponse> {
    return this.makeRequest<OrderResponse>(`/pedidos/numero/${number}`);
  }

  // Cambiar estado del pedido
  async changeOrderStatus(id: number, status: string): Promise<OrderResponse> {
    return this.makeRequest<OrderResponse>(`/pedidos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: status }),
    });
  }

  // Confirmar pedido
  async confirmOrder(id: number): Promise<OrderResponse> {
    return this.makeRequest<OrderResponse>(`/pedidos/${id}/confirmar`, {
      method: 'PATCH',
    });
  }

  // Marcar como entregado
  async markAsDelivered(id: number): Promise<OrderResponse> {
    return this.makeRequest<OrderResponse>(`/pedidos/${id}/entregar`, {
      method: 'PATCH',
    });
  }

  // Cancelar pedido
  async cancelOrder(id: number): Promise<OrderResponse> {
    return this.makeRequest<OrderResponse>(`/pedidos/${id}/cancelar`, {
      method: 'PATCH',
    });
  }
}

export const ordersService = new OrdersService();
