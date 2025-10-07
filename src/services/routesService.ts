import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://intelekia-miaumiau-back.vvggha.easypanel.host/api';

export interface Route {
  id: number;
  nombre_ruta: string;
  fecha_ruta: string;
  fkid_ciudad: number;
  fkid_repartidor: number;
  estado: 'planificada' | 'en_progreso' | 'completada' | 'cancelada';
  total_pedidos: number;
  total_entregados: number;
  distancia_estimada: number;
  tiempo_estimado: number;
  notas?: string;
  orden_prioridad?: number;
  baja_logica?: boolean;
  created_at?: string;
  updated_at?: string;
  fecha_creacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  repartidor?: {
    id: number;
    codigo_repartidor?: string;
    nombre_completo: string;
    telefono?: string;
    tipo_vehiculo?: string;
    capacidad_carga?: number;
    estado?: string;
  };
  ciudad?: {
    id: number;
    nombre: string;
    departamento?: string;
  };
  pedidos?: RouteOrder[];
}

export interface RouteOrder {
  id: number;
  fkid_ruta: number;
  fkid_pedido: number;
  orden_entrega: number;
  lat: number;
  lng: number;
  link_ubicacion?: string;
  notas_entrega?: string;
  estado_entrega: 'pendiente' | 'en_camino' | 'entregado' | 'fallido';
  created_at: string;
  updated_at: string;
  pedido?: {
    id: number;
    numero_pedido: string;
    direccion_entrega: string;
    total?: number;
    cliente?: {
      id: number;
      nombre_completo: string;
      telefono: string;
    };
  };
}

export interface CreateRouteRequest {
  nombre_ruta: string;
  fecha_ruta: string;
  fkid_ciudad: number;
  fkid_repartidor: number;
  notas?: string;
  orden_prioridad?: number;
}

export interface UpdateRouteRequest {
  nombre_ruta?: string;
  fecha_ruta?: string;
  fkid_ciudad?: number;
  fkid_repartidor?: number;
  estado?: string;
  notas?: string;
  orden_prioridad?: number;
}

export interface AssignOrderToRouteRequest {
  fkid_ruta: number;
  fkid_pedido: number;
  orden_entrega: number;
  lat: number;
  lng: number;
  link_ubicacion?: string;
  notas_entrega?: string;
}

export interface RouteStats {
  total_rutas: number;
  rutas_planificadas: number;
  rutas_en_progreso: number;
  rutas_completadas: number;
  rutas_canceladas: number;
  total_pedidos: number;
  pedidos_entregados: number;
  pedidos_pendientes: number;
  distancia_total: number;
  tiempo_promedio: number;
}

export interface AvailableDriver {
  id: number;
  nombre_completo: string;
  telefono?: string;
  rutas_asignadas: number;
  capacidad_disponible: number;
}

export interface AvailableOrder {
  id: number;
  numero_pedido?: string;
  direccion_entrega?: string;
  fkid_ciudad?: number;
  total: number;
  estado: string;
  fecha_pedido?: string;
  fecha_entrega?: string;
  cliente?: {
    id: number;
    nombre_completo: string;
    telefono: string;
    direccion_entrega?: string;
    lat?: number;
    lng?: number;
  };
  productos?: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
}

export interface CreateRouteData {
  nombre_ruta: string;
  fecha_ruta: string;
  fkid_ciudad: number;
  fkid_repartidor: number;
  estado?: string;
  notas?: string;
}

export interface UpdateRouteData {
  nombre_ruta?: string;
  fecha_ruta?: string;
  fkid_ciudad?: number;
  fkid_repartidor?: number;
  estado?: string;
  notas?: string;
}

export interface AssignOrdersToRouteData {
  pedidos: Array<{
    fkid_pedido: number;
    orden_entrega: number;
    lat?: number;
    lng?: number;
    link_ubicacion?: string;
    notas_entrega?: string;
  }>;
}

export interface ReorderRouteOrdersData {
  orden_pedidos: Array<{
    ruta_pedido_id: number;
    nuevo_orden: number;
  }>;
}

export interface RouteStats {
  fecha: string;
  ciudad: {
    id: number;
    nombre: string;
  };
  estadisticas: {
    total_rutas: number;
    rutas_planificadas: number;
    rutas_en_progreso: number;
    rutas_completadas: number;
    rutas_canceladas: number;
    total_pedidos: number;
    pedidos_entregados: number;
    pedidos_pendientes: number;
    distancia_total: number;
    tiempo_total: number;
  };
  por_repartidor: Array<{
    repartidor_id: number;
    nombre: string;
    rutas_asignadas: number;
    pedidos_entregados: number;
    distancia_recorrida: number;
  }>;
}

class RoutesService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Rutas principales
  async createRoute(data: CreateRouteData) {
    return this.makeRequest('/rutas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAllRoutes(params: {
    page?: number;
    limit?: number;
    estado?: string;
    fecha_ruta?: string;
    fkid_ciudad?: number;
    fkid_repartidor?: number;
    search?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return this.makeRequest(`/rutas?${queryParams.toString()}`);
  }

  async getRouteById(id: number) {
    return this.makeRequest(`/rutas/${id}`);
  }

  async updateRoute(id: number, data: UpdateRouteRequest) {
    return this.makeRequest(`/rutas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoute(id: number) {
    return this.makeRequest(`/rutas/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreRoute(id: number) {
    return this.makeRequest(`/rutas/${id}/restore`, {
      method: 'PATCH',
    });
  }

  async changeRouteStatus(id: number, estado: string) {
    return this.makeRequest(`/rutas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  }

  async startRoute(id: number) {
    return this.makeRequest(`/rutas/${id}/iniciar`, {
      method: 'PATCH',
    });
  }

  async completeRoute(id: number) {
    return this.makeRequest(`/rutas/${id}/completar`, {
      method: 'PATCH',
    });
  }

  async getRoutesByDriver(driverId: number, fecha?: string) {
    const queryParams = fecha ? `?fecha=${fecha}` : '';
    return this.makeRequest(`/rutas/repartidor/${driverId}${queryParams}`);
  }

  async getRoutesByCity(cityId: number, fecha?: string) {
    const queryParams = fecha ? `?fecha=${fecha}` : '';
    return this.makeRequest(`/rutas/ciudad/${cityId}${queryParams}`);
  }

  async getActiveRoutes() {
    return this.makeRequest('/rutas/activas');
  }

  async getRouteStats() {
    return this.makeRequest('/rutas/estadisticas');
  }

  // Rutas-Pedidos
  async assignOrderToRoute(data: AssignOrderToRouteRequest) {
    return this.makeRequest('/rutas-pedidos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRouteOrders(routeId: number) {
    return this.makeRequest(`/rutas-pedidos/ruta/${routeId}`);
  }

  async getOrderRoutes(orderId: number) {
    return this.makeRequest(`/rutas-pedidos/pedido/${orderId}`);
  }

  async updateRouteOrder(id: number, data: {
    orden_entrega?: number;
    lat?: number;
    lng?: number;
    link_ubicacion?: string;
    notas_entrega?: string;
  }) {
    return this.makeRequest(`/rutas-pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async markDeliveryAsCompleted(id: number) {
    return this.makeRequest(`/rutas-pedidos/${id}/entregar`, {
      method: 'PATCH',
    });
  }

  async markDeliveryAsInTransit(id: number) {
    return this.makeRequest(`/rutas-pedidos/${id}/en-camino`, {
      method: 'PATCH',
    });
  }

  async markDeliveryAsFailed(id: number) {
    return this.makeRequest(`/rutas-pedidos/${id}/fallar`, {
      method: 'PATCH',
    });
  }

  async getNextDelivery(routeId: number) {
    return this.makeRequest(`/rutas-pedidos/ruta/${routeId}/siguiente`);
  }

  async optimizeRoute(routeId: number) {
    return this.makeRequest(`/rutas-pedidos/ruta/${routeId}/optimizar`, {
      method: 'POST',
    });
  }

  async geolocateAddresses() {
    return this.makeRequest('/rutas-pedidos/geolocalizar', {
      method: 'POST',
    });
  }

  // Utilidades
  async getAvailableDrivers(fecha?: string, ciudad?: number) {
    const queryParams = new URLSearchParams();
    if (fecha) queryParams.append('fecha', fecha);
    if (ciudad) queryParams.append('ciudad', ciudad.toString());

    return this.makeRequest(`/rutas/repartidores-disponibles?${queryParams.toString()}`);
  }

  async getAvailableOrders(fecha?: string, ciudad?: number, estado?: string) {
    const queryParams = new URLSearchParams();
    if (fecha) queryParams.append('fecha', fecha);
    if (ciudad) queryParams.append('ciudad', ciudad.toString());
    if (estado) queryParams.append('estado', estado);

    return this.makeRequest(`/rutas/pedidos-disponibles?${queryParams.toString()}`);
  }

  async calculateDistance(coordinates: Array<{ lat: number; lng: number }>) {
    return this.makeRequest('/rutas/calcular-distancia', {
      method: 'POST',
      body: JSON.stringify({ coordenadas: coordinates }),
    });
  }

  async generateNavigationLinks(id: number) {
    return this.makeRequest(`/rutas-pedidos/${id}/generar-links`, {
      method: 'POST',
    });
  }

  // Reportes
  async getDriverEfficiencyReport(driverId: number, fechaInicio?: string, fechaFin?: string) {
    const queryParams = new URLSearchParams();
    if (fechaInicio) queryParams.append('fecha_inicio', fechaInicio);
    if (fechaFin) queryParams.append('fecha_fin', fechaFin);

    return this.makeRequest(`/rutas/reportes/repartidor/${driverId}?${queryParams.toString()}`);
  }

  async getCityRoutesReport(cityId: number, fechaInicio?: string, fechaFin?: string) {
    const queryParams = new URLSearchParams();
    if (fechaInicio) queryParams.append('fecha_inicio', fechaInicio);
    if (fechaFin) queryParams.append('fecha_fin', fechaFin);

    return this.makeRequest(`/rutas/reportes/ciudad/${cityId}?${queryParams.toString()}`);
  }

  async getRoutesDashboard(fecha?: string) {
    const queryParams = fecha ? `?fecha=${fecha}` : '';
    return this.makeRequest(`/rutas/dashboard${queryParams}`);
  }

  // Nuevos métodos según los endpoints actualizados del backend
  async getRoutesByDate(fecha: string, ciudad?: number, estado?: string) {
    const queryParams = new URLSearchParams();
    if (ciudad) queryParams.append('fkid_ciudad', ciudad.toString());
    if (estado) queryParams.append('estado', estado);
    
    const queryString = queryParams.toString();
    return this.makeRequest(`/rutas/fecha/${fecha}${queryString ? `?${queryString}` : ''}`);
  }

  async getUnassignedOrdersByDate(fecha: string, ciudad: number, page: number = 1, limit: number = 50) {
    const queryParams = new URLSearchParams();
    queryParams.append('fkid_ciudad', ciudad.toString());
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    return this.makeRequest(`/rutas/pedidos-sin-asignar/${fecha}?${queryParams.toString()}`);
  }

  async assignOrdersToRoute(rutaId: number, data: AssignOrdersToRouteData) {
    return this.makeRequest(`/rutas/${rutaId}/pedidos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reorderRouteOrders(rutaId: number, data: ReorderRouteOrdersData) {
    return this.makeRequest(`/rutas/${rutaId}/pedidos/orden`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getRouteStats(fecha?: string, ciudad?: number) {
    const queryParams = new URLSearchParams();
    if (fecha) queryParams.append('fecha', fecha);
    if (ciudad) queryParams.append('ciudad', ciudad.toString());
    
    const queryString = queryParams.toString();
    return this.makeRequest(`/rutas/estadisticas${queryString ? `?${queryString}` : ''}`);
  }

  async getRoutesByDriver(driverId: number, fecha?: string) {
    const queryParams = fecha ? `?fecha=${fecha}` : '';
    return this.makeRequest(`/rutas/repartidor/${driverId}${queryParams}`);
  }

  async updateRoute(id: number, data: UpdateRouteData) {
    return this.makeRequest(`/rutas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoute(id: number) {
    return this.makeRequest(`/rutas/${id}`, {
      method: 'DELETE',
    });
  }

  async changeRouteStatus(id: number, estado: string) {
    return this.makeRequest(`/rutas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  }

  async removeOrderFromRoute(rutaId: number, pedidoId: number) {
    return this.makeRequest(`/rutas/${rutaId}/pedidos/${pedidoId}`, {
      method: 'DELETE',
    });
  }

  async unassignDriverFromRoute(rutaId: number) {
    return this.makeRequest(`/rutas/${rutaId}/repartidor`, {
      method: 'DELETE',
    });
  }
}

export const routesService = new RoutesService();
