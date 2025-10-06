import { authService } from './authService';

// Tipos para los roles
export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
  baja_logica: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  users_count?: number;
}

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

export interface CreateRoleData {
  nombre: string;
  descripcion?: string;
  permissions?: number[];
}

export interface UpdateRoleData {
  nombre?: string;
  descripcion?: string;
  permissions?: number[];
}

export interface RolesResponse {
  success: boolean;
  data: {
    roles: Role[];
    total: number;
  };
}

export interface RoleResponse {
  success: boolean;
  data: Role;
}

export interface RolePermissionsResponse {
  success: boolean;
  data: {
    role: Role;
    permissions: Permission[];
  };
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Clase para manejar los roles
class RolesService {
  // Obtener todos los roles
  async getAllRoles(params?: {
    activos?: 'true' | 'false';
    include_permissions?: 'true' | 'false';
  }): Promise<RolesResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.activos) queryParams.append('activos', params.activos);
      if (params?.include_permissions) queryParams.append('include_permissions', params.include_permissions);

      const endpoint = `/roles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await authService.authenticatedRequest<RolesResponse>(endpoint);
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw error;
    }
  }

  // Obtener un rol por ID
  async getRoleById(id: number): Promise<RoleResponse> {
    try {
      return await authService.authenticatedRequest<RoleResponse>(`/roles/${id}`);
    } catch (error) {
      console.error('Error al obtener rol:', error);
      throw error;
    }
  }

  // Crear un nuevo rol
  async createRole(data: CreateRoleData): Promise<RoleResponse> {
    try {
      return await authService.authenticatedRequest<RoleResponse>('/roles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al crear rol:', error);
      throw error;
    }
  }

  // Actualizar un rol
  async updateRole(id: number, data: UpdateRoleData): Promise<RoleResponse> {
    try {
      return await authService.authenticatedRequest<RoleResponse>(`/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      throw error;
    }
  }

  // Eliminar un rol (baja lógica)
  async deleteRole(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/roles/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error al eliminar rol:', error);
      throw error;
    }
  }

  // Restaurar un rol
  async restoreRole(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/roles/${id}/restore`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Error al restaurar rol:', error);
      throw error;
    }
  }

  // Asignar permiso a un rol
  async assignPermission(roleId: number, permissionId: number): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/roles/${roleId}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ permission_id: permissionId }),
      });
    } catch (error) {
      console.error('Error al asignar permiso:', error);
      throw error;
    }
  }

  // Remover permiso de un rol
  async removePermission(roleId: number, permissionId: number): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/roles/${roleId}/permissions/${permissionId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error al remover permiso:', error);
      throw error;
    }
  }

  // Obtener permisos de un rol
  async getRolePermissions(roleId: number): Promise<RolePermissionsResponse> {
    try {
      return await authService.authenticatedRequest<RolePermissionsResponse>(`/roles/${roleId}/permissions`);
    } catch (error) {
      console.error('Error al obtener permisos del rol:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de roles
export const rolesService = new RolesService();
