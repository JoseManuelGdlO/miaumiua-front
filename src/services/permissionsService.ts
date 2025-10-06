import { authService } from './authService';

// Tipos para los permisos
export interface Permission {
  id: number;
  nombre: string;
  categoria: string;
  descripcion?: string;
  tipo: 'lectura' | 'escritura' | 'eliminacion' | 'administracion' | 'especial';
  baja_logica: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePermissionData {
  nombre: string;
  categoria: string;
  descripcion?: string;
  tipo: 'lectura' | 'escritura' | 'eliminacion' | 'administracion' | 'especial';
}

export interface UpdatePermissionData {
  nombre?: string;
  categoria?: string;
  descripcion?: string;
  tipo?: 'lectura' | 'escritura' | 'eliminacion' | 'administracion' | 'especial';
}

export interface PermissionsResponse {
  success: boolean;
  data: {
    permissions: Permission[];
    total: number;
  };
}

export interface PermissionResponse {
  success: boolean;
  data: Permission;
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: string[];
  };
}

export interface TypesResponse {
  success: boolean;
  data: {
    types: string[];
  };
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Categorías y acciones predefinidas
export const PERMISSION_CATEGORIES = {
  usuarios: {
    name: "Gestión de usuarios del sistema",
    actions: ["ver", "crear", "editar", "eliminar", "administrar"]
  },
  roles: {
    name: "Gestión de roles", 
    actions: ["ver", "crear", "editar", "eliminar", "asignar_permisos"]
  },
  permisos: {
    name: "Gestión de permisos",
    actions: ["ver", "crear", "editar", "eliminar"]
  },
  clientes: {
    name: "Gestión de clientes",
    actions: ["ver", "crear", "editar", "eliminar", "ver_stats"]
  },
  mascotas: {
    name: "Gestión de mascotas",
    actions: ["ver", "crear", "editar", "eliminar"]
  },
  pedidos: {
    name: "Gestión de pedidos",
    actions: ["ver", "crear", "editar", "eliminar", "cambiar_estado", "confirmar", "entregar", "cancelar", "ver_stats"]
  },
  productos_pedido: {
    name: "Productos en pedidos",
    actions: ["ver", "crear", "editar", "eliminar"]
  },
  inventarios: {
    name: "Gestión de inventarios",
    actions: ["ver", "crear", "editar", "eliminar"]
  },
  categorias_producto: {
    name: "Categorías de productos",
    actions: ["ver", "crear", "editar", "eliminar"]
  },
  pesos: {
    name: "Gestión de pesos",
    actions: ["ver", "crear", "editar", "eliminar"]
  },
  proveedores: {
    name: "Gestión de proveedores",
    actions: ["ver", "crear", "editar", "eliminar"]
  },
  ciudades: {
    name: "Gestión de ciudades",
    actions: ["ver", "crear", "editar", "eliminar"]
  },
  promociones: {
    name: "Gestión de promociones",
    actions: ["ver", "crear", "editar", "eliminar"]
  },
  conversaciones: {
    name: "Gestión de conversaciones",
    actions: ["ver", "crear", "editar", "eliminar", "cambiar_estado", "asignar"]
  },
  conversaciones_chat: {
    name: "Mensajes de chat",
    actions: ["ver", "crear", "editar", "eliminar", "marcar_leido"]
  },
  conversaciones_logs: {
    name: "Logs de conversaciones",
    actions: ["ver", "crear", "editar", "eliminar"]
  },
  sistema: {
    name: "Gestión del sistema",
    actions: ["ver_logs", "configurar", "backup", "restore"]
  },
  reportes: {
    name: "Gestión de reportes",
    actions: ["ver", "generar", "exportar"]
  }
} as const;

// Clase para manejar los permisos
class PermissionsService {
  // Obtener todos los permisos
  async getAllPermissions(params?: {
    categoria?: string;
    tipo?: string;
    activos?: 'true' | 'false';
  }): Promise<PermissionsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.categoria) queryParams.append('categoria', params.categoria);
      if (params?.tipo) queryParams.append('tipo', params.tipo);
      if (params?.activos) queryParams.append('activos', params.activos);

      const endpoint = `/permissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await authService.authenticatedRequest<PermissionsResponse>(endpoint);
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      throw error;
    }
  }

  // Obtener un permiso por ID
  async getPermissionById(id: number): Promise<PermissionResponse> {
    try {
      return await authService.authenticatedRequest<PermissionResponse>(`/permissions/${id}`);
    } catch (error) {
      console.error('Error al obtener permiso:', error);
      throw error;
    }
  }

  // Crear un nuevo permiso
  async createPermission(data: CreatePermissionData): Promise<PermissionResponse> {
    try {
      return await authService.authenticatedRequest<PermissionResponse>('/permissions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al crear permiso:', error);
      throw error;
    }
  }

  // Actualizar un permiso
  async updatePermission(id: number, data: UpdatePermissionData): Promise<PermissionResponse> {
    try {
      return await authService.authenticatedRequest<PermissionResponse>(`/permissions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al actualizar permiso:', error);
      throw error;
    }
  }

  // Eliminar un permiso (baja lógica)
  async deletePermission(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/permissions/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error al eliminar permiso:', error);
      throw error;
    }
  }

  // Obtener categorías disponibles
  async getCategories(): Promise<CategoriesResponse> {
    try {
      return await authService.authenticatedRequest<CategoriesResponse>('/permissions/categories');
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  }

  // Obtener tipos disponibles
  async getTypes(): Promise<TypesResponse> {
    try {
      return await authService.authenticatedRequest<TypesResponse>('/permissions/types');
    } catch (error) {
      console.error('Error al obtener tipos:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de permisos
export const permissionsService = new PermissionsService();
