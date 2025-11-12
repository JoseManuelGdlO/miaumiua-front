import { authService } from './authService';

// Tipos para los usuarios
export interface User {
  id: number;
  nombre_completo: string;
  correo_electronico: string;
  rol_id: number;
  ciudad_id?: number;
  isActive: boolean;
  baja_logica: boolean;
  lastLogin?: string;
  created_at: string;
  updated_at: string;
  rol?: Role;
  ciudad?: City;
}

export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface City {
  id: number;
  nombre: string;
  codigo: string;
}

export interface CreateUserData {
  nombre_completo: string;
  correo_electronico: string;
  contrasena: string;
  rol_id: number;
  ciudad_id?: number;
}

export interface UpdateUserData {
  nombre_completo?: string;
  correo_electronico?: string;
  rol_id?: number;
  ciudad_id?: number;
  isActive?: boolean;
}

export interface ChangePasswordData {
  newPassword: string;
}

export interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface UserStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    inactive: number;
    byRole: Array<{
      role: string;
      count: number;
    }>;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Clase para manejar los usuarios
class UsersService {
  // Obtener todos los usuarios
  async getAllUsers(params?: {
    activos?: 'true' | 'false';
    rol_id?: number;
    ciudad_id?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.activos) queryParams.append('activos', params.activos);
      if (params?.rol_id) queryParams.append('rol_id', params.rol_id.toString());
      if (params?.ciudad_id) queryParams.append('ciudad_id', params.ciudad_id.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await authService.authenticatedRequest<UsersResponse>(endpoint);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  // Obtener estadísticas de usuarios
  async getUserStats(): Promise<UserStatsResponse> {
    try {
      return await authService.authenticatedRequest<UserStatsResponse>('/users/stats');
    } catch (error) {
      console.error('Error al obtener estadísticas de usuarios:', error);
      throw error;
    }
  }

  // Obtener un usuario por ID
  async getUserById(id: number): Promise<UserResponse> {
    try {
      return await authService.authenticatedRequest<UserResponse>(`/users/${id}`);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error;
    }
  }

  // Crear un nuevo usuario
  async createUser(data: CreateUserData): Promise<UserResponse> {
    try {
      return await authService.authenticatedRequest<UserResponse>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  // Actualizar un usuario
  async updateUser(id: number, data: UpdateUserData): Promise<UserResponse> {
    try {
      return await authService.authenticatedRequest<UserResponse>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  // Eliminar un usuario (eliminación física)
  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/users/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  // Restaurar un usuario
  async restoreUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/users/${id}/restore`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Error al restaurar usuario:', error);
      throw error;
    }
  }

  // Cambiar contraseña de un usuario
  async changeUserPassword(id: number, data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/users/${id}/change-password`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  }

  async getUsersByRole(roleName: string) {
    try {
      return await authService.authenticatedRequest(`/usuarios/rol/${roleName}`);
    } catch (error) {
      console.error('Error al obtener usuarios por rol:', error);
      throw error;
    }
  }

  async getDrivers() {
    try {
      return await authService.authenticatedRequest('/usuarios/repartidores');
    } catch (error) {
      console.error('Error al obtener repartidores:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de usuarios
export const usersService = new UsersService();
