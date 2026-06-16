import type { NavigateFunction } from 'react-router-dom';
import { config } from '../config/environment';
import { authService } from './authService';

// Interfaces para las notificaciones del backend
export interface BackendNotification {
  id: number;
  nombre: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  leida: boolean;
  fecha_creacion: string; // YYYY-MM-DD
  hora_creacion: string; // HH:mm:ss
  datos: {
    type?: 'stock' | 'order' | 'promotion' | 'route' | 'error' | 'conversation';
    tipo?: string;
    actionUrl?: string;
    errorDetails?: string;
    conversationId?: string | number;
    conversacionId?: string | number;
    accion?: NotificationAction;
    [key: string]: any;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  success: boolean;
  data: BackendNotification;
  message?: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: BackendNotification[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  count?: number;
}

export interface NotificationStatsResponse {
  success: boolean;
  data: {
    total: number;
    leidas: number;
    noLeidas: number;
    porPrioridad: Array<{
      prioridad: string;
      total: number;
    }>;
  };
}

export interface DashboardKPIsResponse {
  success: boolean;
  data: {
    conversacionesActivas: {
      valor: number;
      cambio: number;
      cambioFormato: string;
    };
    clientesRegistrados: {
      valor: number;
      cambio: number;
      cambioFormato: string;
    };
    ciudadesActivas: {
      valor: number;
      cambio: number;
      cambioFormato: string;
    };
    ventasDelMes: {
      valor: number;
      cambio: number;
      cambioFormato: string;
      formatoMoneda: string;
    };
  };
  periodo: {
    mesActual: {
      inicio: string;
      fin: string;
      nombre: string;
    };
    mesAnterior: {
      inicio: string;
      fin: string;
      nombre: string;
    };
  };
}

export interface NotificationsQueryParams {
  page?: number;
  limit?: number;
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  leida?: boolean | 'true' | 'false';
  fecha_inicio?: string;
  fecha_fin?: string;
  search?: string;
}

export interface CreateNotificationData {
  nombre: string;
  descripcion?: string;
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  datos?: any;
}

export interface UpdateNotificationData {
  nombre?: string;
  descripcion?: string;
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  leida?: boolean;
  datos?: any;
}

export interface NotificationAction {
  tipo: string;
  conversacionId?: string | number;
  ruta?: string;
}

// Interfaz para el frontend (mapeada desde el backend)
export interface Notification {
  id: string;
  type: 'stock' | 'order' | 'promotion' | 'route' | 'error' | 'conversation';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low' | 'urgent';
  read: boolean;
  actionUrl?: string;
  action?: NotificationAction;
  errorDetails?: string;
  conversationId?: string;
}

const CONVERSATION_DETAIL_PATH = '/dashboard/conversations';

export const getConversationNavigationPath = (conversacionId: string | number): string =>
  `${CONVERSATION_DETAIL_PATH}/${conversacionId}`;

export const resolveNotificationNavigationPath = (notification: Notification): string | undefined => {
  const accion = notification.action;
  if (accion?.tipo === 'ir_conversacion') {
    const conversacionId = accion.conversacionId ?? notification.conversationId;
    if (conversacionId != null) {
      return getConversationNavigationPath(conversacionId);
    }

    const rutaMatch = accion.ruta?.match(/\/conversaciones\/(\d+)/);
    if (rutaMatch) {
      return getConversationNavigationPath(rutaMatch[1]);
    }
  }

  return notification.actionUrl;
};

export const handleNotificationNavigation = (
  notification: Notification,
  navigate: NavigateFunction,
  options?: {
    onClose?: () => void;
    markAsRead?: (id: string) => void;
  }
): boolean => {
  const path = resolveNotificationNavigationPath(notification);
  if (!path) {
    return false;
  }

  options?.onClose?.();
  if (!notification.read) {
    options?.markAsRead?.(notification.id);
  }
  navigate(path);
  return true;
};

// Interfaz para actividades recientes (formato diferente del endpoint /actividad-reciente)
export interface RecentActivity {
  tipo: 'conversacion' | 'venta' | 'cliente' | 'inventario';
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  status: string;
  statusLabel: string;
  tiempoRelativo: string;
  fechaFormateada: string;
  datos?: {
    conversacionId?: number;
    clienteId?: number;
    clienteNombre?: string;
    ciudad?: string;
    pedidoId?: number;
    numeroPedido?: string;
    total?: number;
    inventarioId?: number;
    productoNombre?: string;
    stockActual?: number;
    stockMinimo?: number;
    ciudadId?: number;
    canalContacto?: string;
    [key: string]: any;
  };
}

export interface RecentActivityResponse {
  success: boolean;
  data: RecentActivity[];
  total: number;
  filtros: {
    limiteHoras: number;
    tipo: string;
  };
}

class NotificationsService {
  private makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = authService.getToken();
    
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
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      });
  }

  private resolveNotificationType(
    datos: NonNullable<BackendNotification['datos']>
  ): Notification['type'] {
    if (datos.type) {
      return datos.type;
    }

    if (
      datos.tipo === 'modificacion_pedido_activo' ||
      datos.accion?.tipo === 'ir_conversacion' ||
      datos.conversacionId != null
    ) {
      return 'conversation';
    }

    return 'order';
  }

  private resolveConversationId(
    datos: NonNullable<BackendNotification['datos']>
  ): string | undefined {
    const conversacionId =
      datos.accion?.conversacionId ??
      datos.conversacionId ??
      datos.conversationId;

    return conversacionId != null ? conversacionId.toString() : undefined;
  }

  // Mapear notificación del backend al formato del frontend
  private mapNotification(backendNotif: BackendNotification): Notification {
    const datos = backendNotif.datos || {};
    const fechaHora = `${backendNotif.fecha_creacion}T${backendNotif.hora_creacion}`;
    const conversationId = this.resolveConversationId(datos);
    
    // Mapear prioridad del backend al frontend
    const priorityMap: Record<string, 'high' | 'medium' | 'low' | 'urgent'> = {
      'baja': 'low',
      'media': 'medium',
      'alta': 'high',
      'urgente': 'urgent'
    };

    const notification: Notification = {
      id: backendNotif.id.toString(),
      type: this.resolveNotificationType(datos),
      title: backendNotif.nombre,
      message: backendNotif.descripcion || '',
      timestamp: fechaHora,
      priority: priorityMap[backendNotif.prioridad] || 'medium',
      read: backendNotif.leida,
      actionUrl: datos.actionUrl,
      action: datos.accion,
      errorDetails: datos.errorDetails,
      conversationId,
    };

    if (!notification.actionUrl) {
      notification.actionUrl = resolveNotificationNavigationPath(notification);
    }

    return notification;
  }

  // Obtener todas las notificaciones con paginación y filtros
  async getAllNotifications(params: NotificationsQueryParams = {}): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.prioridad) queryParams.append('prioridad', params.prioridad);
    if (params.leida !== undefined) {
      queryParams.append('leida', params.leida === true || params.leida === 'true' ? 'true' : 'false');
    }
    if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/notificaciones${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<NotificationsResponse>(endpoint);
  }

  // Obtener notificación por ID
  async getNotificationById(id: number): Promise<NotificationResponse> {
    return this.makeRequest<NotificationResponse>(`/notificaciones/${id}`);
  }

  // Obtener notificaciones leídas
  async getReadNotifications(): Promise<NotificationsResponse> {
    return this.makeRequest<NotificationsResponse>('/notificaciones/leidas');
  }

  // Obtener notificaciones no leídas
  async getUnreadNotifications(): Promise<NotificationsResponse> {
    return this.makeRequest<NotificationsResponse>('/notificaciones/no-leidas');
  }

  // Obtener notificaciones urgentes
  async getUrgentNotifications(): Promise<NotificationsResponse> {
    return this.makeRequest<NotificationsResponse>('/notificaciones/urgentes');
  }

  // Obtener notificaciones por prioridad
  async getNotificationsByPriority(prioridad: 'baja' | 'media' | 'alta' | 'urgente'): Promise<NotificationsResponse> {
    return this.makeRequest<NotificationsResponse>(`/notificaciones/prioridad/${prioridad}`);
  }

  // Obtener notificaciones por fecha
  async getNotificationsByDate(fecha: string): Promise<NotificationsResponse> {
    return this.makeRequest<NotificationsResponse>(`/notificaciones/fecha/${fecha}`);
  }

  // Obtener notificaciones recientes
  async getRecentNotifications(limit: number = 10): Promise<NotificationsResponse> {
    return this.makeRequest<NotificationsResponse>(`/notificaciones/recent?limit=${limit}`);
  }

  // Obtener estadísticas
  async getStats(): Promise<NotificationStatsResponse> {
    return this.makeRequest<NotificationStatsResponse>('/notificaciones/stats');
  }

  // Obtener KPIs del dashboard (opcional: filtrar por mes y año)
  async getDashboardKPIs(anio?: number, mes?: number): Promise<DashboardKPIsResponse> {
    const params = new URLSearchParams();
    if (anio != null && mes != null) {
      params.append('anio', String(anio));
      params.append('mes', String(mes));
    }
    const query = params.toString();
    return this.makeRequest<DashboardKPIsResponse>(
      `/notificaciones/dashboard-kpis${query ? `?${query}` : ''}`
    );
  }

  // Crear nueva notificación
  async createNotification(data: CreateNotificationData): Promise<NotificationResponse> {
    return this.makeRequest<NotificationResponse>('/notificaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Actualizar notificación
  async updateNotification(id: number, data: UpdateNotificationData): Promise<NotificationResponse> {
    return this.makeRequest<NotificationResponse>(`/notificaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Eliminar notificación
  async deleteNotification(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/notificaciones/${id}`, {
      method: 'DELETE',
    });
  }

  // Marcar como leída
  async markAsRead(id: number): Promise<NotificationResponse> {
    return this.makeRequest<NotificationResponse>(`/notificaciones/${id}/marcar-leida`, {
      method: 'PATCH',
    });
  }

  // Marcar como no leída
  async markAsUnread(id: number): Promise<NotificationResponse> {
    return this.makeRequest<NotificationResponse>(`/notificaciones/${id}/marcar-no-leida`, {
      method: 'PATCH',
    });
  }

  // Marcar todas como leídas
  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>('/notificaciones/marcar-todas-leidas', {
      method: 'PATCH',
    });
  }

  // Helper para obtener notificaciones mapeadas (formato frontend)
  async getMappedNotifications(params: NotificationsQueryParams = {}): Promise<{
    notifications: Notification[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const response = await this.getAllNotifications(params);
    const notifications = response.data.map(notif => this.mapNotification(notif));
    
    return {
      notifications,
      pagination: response.pagination
    };
  }

  // Helper para obtener notificaciones recientes mapeadas
  async getMappedRecentNotifications(limit: number = 10): Promise<Notification[]> {
    const response = await this.getRecentNotifications(limit);
    return response.data.map(notif => this.mapNotification(notif));
  }

  // Obtener actividades recientes
  async getRecentActivity(params?: {
    limit?: number;
    tipo?: 'conversacion' | 'venta';
  }): Promise<RecentActivityResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.tipo) {
      queryParams.append('tipo', params.tipo);
    }

    const queryString = queryParams.toString();
    const endpoint = `/notificaciones/actividad-reciente${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<RecentActivityResponse>(endpoint);
  }

  // Helper para obtener actividades recientes mapeadas al formato del frontend
  async getMappedRecentActivity(params?: {
    limit?: number;
    tipo?: 'conversacion' | 'venta';
  }): Promise<Notification[]> {
    const response = await this.getRecentActivity(params);
    
    // Mapear actividades al formato Notification para compatibilidad con el Dashboard
    return response.data.map(actividad => {
      // Mapear el tipo de actividad al tipo de notificación
      let notificationType: 'stock' | 'order' | 'promotion' | 'route' | 'error' | 'conversation' = 'order';
      if (actividad.tipo === 'conversacion') {
        notificationType = 'conversation';
      } else if (actividad.tipo === 'venta') {
        notificationType = 'order';
      } else if (actividad.tipo === 'inventario') {
        notificationType = 'stock';
      }

      // Construir actionUrl basado en el tipo de actividad
      let actionUrl: string | undefined;
      if (actividad.datos?.conversacionId) {
        actionUrl = `/dashboard/conversations/${actividad.datos.conversacionId}`;
      } else if (actividad.datos?.pedidoId) {
        actionUrl = `/dashboard/orders/${actividad.datos.pedidoId}`;
      } else if (actividad.datos?.clienteId) {
        actionUrl = `/dashboard/customers/${actividad.datos.clienteId}`;
      } else if (actividad.datos?.inventarioId) {
        actionUrl = `/dashboard/inventory`;
      }

      return {
        id: actividad.id,
        type: notificationType,
        title: actividad.titulo,
        message: actividad.descripcion,
        timestamp: actividad.fechaFormateada || actividad.fecha,
        priority: 'medium' as const,
        read: false,
        actionUrl: actionUrl,
        conversationId: actividad.datos?.conversacionId?.toString(),
      };
    });
  }
}

export const notificationsService = new NotificationsService();

