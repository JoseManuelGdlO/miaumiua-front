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
    actionUrl?: string;
    errorDetails?: string;
    conversationId?: string | number;
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
  errorDetails?: string;
  conversationId?: string;
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

  // Mapear notificación del backend al formato del frontend
  private mapNotification(backendNotif: BackendNotification): Notification {
    const datos = backendNotif.datos || {};
    const fechaHora = `${backendNotif.fecha_creacion}T${backendNotif.hora_creacion}`;
    
    // Mapear prioridad del backend al frontend
    const priorityMap: Record<string, 'high' | 'medium' | 'low' | 'urgent'> = {
      'baja': 'low',
      'media': 'medium',
      'alta': 'high',
      'urgente': 'urgent'
    };

    return {
      id: backendNotif.id.toString(),
      type: datos.type || 'order',
      title: backendNotif.nombre,
      message: backendNotif.descripcion || '',
      timestamp: fechaHora,
      priority: priorityMap[backendNotif.prioridad] || 'medium',
      read: backendNotif.leida,
      actionUrl: datos.actionUrl,
      errorDetails: datos.errorDetails,
      conversationId: datos.conversationId?.toString()
    };
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
}

export const notificationsService = new NotificationsService();

