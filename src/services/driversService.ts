import { authService } from './authService';
import { getCurrentConfig } from '@/config/environment';

// Tipos para los repartidores
export interface Driver {
  id: number;
  codigo_repartidor: string;
  nombre_completo: string;
  telefono: string;
  email: string;
  fkid_ciudad: number;
  fkid_usuario?: number;
  tipo_vehiculo: 'moto' | 'bicicleta' | 'auto' | 'camioneta' | 'caminando';
  capacidad_carga: number;
  estado: 'activo' | 'inactivo' | 'ocupado' | 'disponible' | 'en_ruta';
  zona_cobertura?: {
    centro: {
      lat: number;
      lng: number;
    };
    radio: number;
  };
  horario_trabajo?: {
    [key: string]: {
      inicio: string;
      fin: string;
    } | null;
  };
  tarifa_base: number;
  comision_porcentaje: number;
  fecha_ingreso: string;
  fecha_nacimiento: string;
  direccion: string;
  documento_identidad: string;
  licencia_conducir: string;
  seguro_vehiculo: string;
  notas?: string;
  calificacion_promedio?: number;
  total_entregas?: number;
  total_km_recorridos?: number;
  fecha_ultima_entrega?: string;
  ciudad?: {
    id: number;
    nombre: string;
    departamento: string;
  };
  usuario?: {
    id: number;
    nombre_completo: string;
    correo_electronico: string;
  };
  rutas?: Array<{
    id: number;
    nombre_ruta: string;
    fecha_ruta: string;
    estado: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CreateDriverData {
  codigo_repartidor: string;
  nombre_completo: string;
  telefono: string;
  email: string;
  fkid_ciudad: number;
  fkid_usuario?: number;
  tipo_vehiculo: 'moto' | 'bicicleta' | 'auto' | 'camioneta' | 'caminando';
  capacidad_carga: number;
  zona_cobertura?: {
    centro: {
      lat: number;
      lng: number;
    };
    radio: number;
  };
  horario_trabajo?: {
    [key: string]: {
      inicio: string;
      fin: string;
    } | null;
  };
  tarifa_base: number;
  comision_porcentaje: number;
  fecha_ingreso: string;
  fecha_nacimiento: string;
  direccion: string;
  documento_identidad: string;
  licencia_conducir: string;
  seguro_vehiculo: string;
  notas?: string;
  contrasena?: string;
}

export interface UpdateDriverData {
  codigo_repartidor?: string;
  nombre_completo?: string;
  telefono?: string;
  email?: string;
  fkid_ciudad?: number;
  fkid_usuario?: number;
  tipo_vehiculo?: 'moto' | 'bicicleta' | 'auto' | 'camioneta' | 'caminando';
  capacidad_carga?: number;
  estado?: 'activo' | 'inactivo' | 'ocupado' | 'disponible' | 'en_ruta';
  zona_cobertura?: {
    centro: {
      lat: number;
      lng: number;
    };
    radio: number;
  };
  horario_trabajo?: {
    [key: string]: {
      inicio: string;
      fin: string;
    } | null;
  };
  tarifa_base?: number;
  comision_porcentaje?: number;
  fecha_ingreso?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  documento_identidad?: string;
  licencia_conducir?: string;
  seguro_vehiculo?: string;
  notas?: string;
  contrasena?: string;
}

export interface ChangeDriverStatusData {
  estado: 'activo' | 'inactivo' | 'ocupado' | 'disponible' | 'en_ruta';
}

export interface UpdateDriverMetricsData {
  entregas?: number;
  km?: number;
  calificacion?: number;
}

export interface DriversResponse {
  success: boolean;
  data: {
    repartidores: Driver[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DriverResponse {
  success: boolean;
  data?: Driver;
  message?: string;
  errors?: Array<{
    type: string;
    value: any;
    msg: string;
    path: string;
    location: string;
  }>;
}

export interface DriverStatsResponse {
  success: boolean;
  data: Array<{
    estado: string;
    cantidad: number;
  }>;
}

export interface AvailableDriversResponse {
  success: boolean;
  data: Array<{
    id: number;
    codigo_repartidor: string;
    nombre_completo: string;
    tipo_vehiculo: string;
    capacidad_carga: number;
    calificacion_promedio: number;
    total_entregas: number;
  }>;
}

export interface DriverScheduleResponse {
  success: boolean;
  data: {
    repartidor_id: number;
    nombre: string;
    en_horario: boolean;
    fecha_consulta: string;
    horario_trabajo: {
      [key: string]: {
        inicio: string;
        fin: string;
      } | null;
    };
  };
}

export interface RepartidorLoginCredentials {
  email?: string;
  codigo_repartidor?: string;
  contrasena: string;
}

export interface RepartidorLoginResponse {
  success: boolean;
  message?: string;
  data?: {
    repartidor: {
      id: number;
      codigo_repartidor: string;
      nombre_completo: string;
      telefono: string;
      email: string;
      tipo_vehiculo: string;
      estado: string;
      ciudad?: {
        id: number;
        nombre: string;
        departamento: string;
      };
      calificacion_promedio?: number;
      total_entregas?: number;
    };
    token: string;
    refreshToken: string;
  };
  error?: string;
}

// Clase para manejar los repartidores
class DriversService {
  // Login de repartidor
  async loginRepartidor(credentials: RepartidorLoginCredentials): Promise<RepartidorLoginResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/repartidores/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Error al iniciar sesión',
        };
      }

      // Si el login es exitoso, guardar el token y datos del repartidor en localStorage
      if (data.success && data.data?.token && data.data?.repartidor) {
        try {
          console.log('=== GUARDANDO DATOS DEL REPARTIDOR ===');
          console.log('Datos recibidos del backend:', data.data.repartidor);
          
          // Guardar token
          localStorage.setItem('repartidor_token', data.data.token);
          console.log('Token guardado:', data.data.token ? '✓' : '✗');
          
          // Guardar refresh token
          if (data.data.refreshToken) {
            localStorage.setItem('repartidor_refresh_token', data.data.refreshToken);
            console.log('Refresh token guardado:', data.data.refreshToken ? '✓' : '✗');
          }
          
          // Guardar datos del repartidor
          const repartidorDataString = JSON.stringify(data.data.repartidor);
          localStorage.setItem('repartidor_data', repartidorDataString);
          console.log('Datos del repartidor guardados:', repartidorDataString ? '✓' : '✗');
          
          // Verificar que se guardó correctamente
          const savedToken = localStorage.getItem('repartidor_token');
          const savedData = localStorage.getItem('repartidor_data');
          
          if (savedToken && savedData) {
            const parsedData = JSON.parse(savedData);
            console.log('=== VERIFICACIÓN DE PERSISTENCIA ===');
            console.log('Token verificado:', savedToken ? '✓' : '✗');
            console.log('Datos verificados:', parsedData);
            console.log('ID del repartidor:', parsedData?.id);
            console.log('Nombre:', parsedData?.nombre_completo);
            console.log('Email:', parsedData?.email);
            console.log('=== FIN VERIFICACIÓN ===');
          } else {
            console.error('ERROR: No se pudieron guardar los datos en localStorage');
            throw new Error('Error al guardar datos en localStorage');
          }
        } catch (error) {
          console.error('Error al guardar datos del repartidor en localStorage:', error);
          throw error;
        }
      } else {
        console.error('ERROR: La respuesta del login no contiene los datos necesarios');
        console.error('data.success:', data.success);
        console.error('data.data?.token:', data.data?.token);
        console.error('data.data?.repartidor:', data.data?.repartidor);
      }

      return data;
    } catch (error) {
      console.error('Error en login de repartidor:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  }

  // Obtener la URL base del API
  private getBaseUrl(): string {
    const config = getCurrentConfig();
    return config.apiBaseUrl;
  }
  // Obtener todos los repartidores
  async getAllDrivers(params?: {
    page?: number;
    limit?: number;
    estado?: string;
    tipo_vehiculo?: string;
    ciudad?: number;
    disponibles?: boolean;
    search?: string;
  }): Promise<DriversResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.estado) queryParams.append('estado', params.estado);
      if (params?.tipo_vehiculo) queryParams.append('tipo_vehiculo', params.tipo_vehiculo);
      if (params?.ciudad) queryParams.append('ciudad', params.ciudad.toString());
      if (params?.disponibles) queryParams.append('disponibles', 'true');
      if (params?.search) queryParams.append('search', params.search);

      const endpoint = `/repartidores${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await authService.authenticatedRequest<DriversResponse>(endpoint);
    } catch (error) {
      console.error('Error al obtener repartidores:', error);
      throw error;
    }
  }

  // Obtener un repartidor por ID
  async getDriverById(id: number): Promise<DriverResponse> {
    try {
      return await authService.authenticatedRequest<DriverResponse>(`/repartidores/${id}`);
    } catch (error) {
      console.error('Error al obtener repartidor:', error);
      throw error;
    }
  }

  // Crear un nuevo repartidor
  async createDriver(driverData: CreateDriverData): Promise<DriverResponse> {
    try {
      return await authService.authenticatedRequest<DriverResponse>('/repartidores', {
        method: 'POST',
        body: JSON.stringify(driverData),
      });
    } catch (error) {
      console.error('Error al crear repartidor:', error);
      throw error;
    }
  }

  // Actualizar un repartidor
  async updateDriver(id: number, driverData: UpdateDriverData): Promise<DriverResponse> {
    try {
      return await authService.authenticatedRequest<DriverResponse>(`/repartidores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(driverData),
      });
    } catch (error) {
      console.error('Error al actualizar repartidor:', error);
      throw error;
    }
  }

  // Eliminar un repartidor (soft delete)
  async deleteDriver(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; message: string }>(`/repartidores/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error al eliminar repartidor:', error);
      throw error;
    }
  }

  // Restaurar un repartidor
  async restoreDriver(id: number): Promise<DriverResponse> {
    try {
      return await authService.authenticatedRequest<DriverResponse>(`/repartidores/${id}/restore`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Error al restaurar repartidor:', error);
      throw error;
    }
  }

  // Cambiar estado del repartidor
  async changeDriverStatus(id: number, statusData: ChangeDriverStatusData): Promise<DriverResponse> {
    try {
      return await authService.authenticatedRequest<DriverResponse>(`/repartidores/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      });
    } catch (error) {
      console.error('Error al cambiar estado del repartidor:', error);
      throw error;
    }
  }

  // Actualizar métricas del repartidor
  async updateDriverMetrics(id: number, metricsData: UpdateDriverMetricsData): Promise<DriverResponse> {
    try {
      return await authService.authenticatedRequest<DriverResponse>(`/repartidores/${id}/metricas`, {
        method: 'PATCH',
        body: JSON.stringify(metricsData),
      });
    } catch (error) {
      console.error('Error al actualizar métricas del repartidor:', error);
      throw error;
    }
  }

  // Obtener repartidores disponibles
  async getAvailableDrivers(ciudad?: number): Promise<AvailableDriversResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (ciudad) queryParams.append('ciudad', ciudad.toString());
      
      const endpoint = `/repartidores/disponibles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await authService.authenticatedRequest<AvailableDriversResponse>(endpoint);
    } catch (error) {
      console.error('Error al obtener repartidores disponibles:', error);
      throw error;
    }
  }

  // Obtener repartidores por ciudad
  async getDriversByCity(ciudadId: number): Promise<{ success: boolean; data: Driver[] }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; data: Driver[] }>(`/repartidores/ciudad/${ciudadId}`);
    } catch (error) {
      console.error('Error al obtener repartidores por ciudad:', error);
      throw error;
    }
  }

  // Obtener repartidores por tipo de vehículo
  async getDriversByVehicleType(tipo: string): Promise<{ success: boolean; data: Driver[] }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; data: Driver[] }>(`/repartidores/tipo-vehiculo/${tipo}`);
    } catch (error) {
      console.error('Error al obtener repartidores por tipo de vehículo:', error);
      throw error;
    }
  }

  // Obtener mejores calificados
  async getTopRatedDrivers(limit: number = 10): Promise<{ success: boolean; data: Driver[] }> {
    try {
      return await authService.authenticatedRequest<{ success: boolean; data: Driver[] }>(`/repartidores/mejores-calificados?limit=${limit}`);
    } catch (error) {
      console.error('Error al obtener mejores repartidores:', error);
      throw error;
    }
  }

  // Obtener estadísticas de repartidores
  async getDriverStats(): Promise<DriverStatsResponse> {
    try {
      return await authService.authenticatedRequest<DriverStatsResponse>('/repartidores/estadisticas');
    } catch (error) {
      console.error('Error al obtener estadísticas de repartidores:', error);
      throw error;
    }
  }

  // Verificar horario de trabajo
  async checkDriverSchedule(id: number, fecha: string): Promise<DriverScheduleResponse> {
    try {
      return await authService.authenticatedRequest<DriverScheduleResponse>(`/repartidores/${id}/horario-trabajo?fecha=${fecha}`);
    } catch (error) {
      console.error('Error al verificar horario de trabajo:', error);
      throw error;
    }
  }

  // Logout de repartidor
  logoutRepartidor(): void {
    localStorage.removeItem('repartidor_token');
    localStorage.removeItem('repartidor_refresh_token');
    localStorage.removeItem('repartidor_data');
  }

  // Verificar si el repartidor está autenticado
  isRepartidorAuthenticated(): boolean {
    const token = localStorage.getItem('repartidor_token');
    return !!token;
  }

  // Obtener el token del repartidor
  getRepartidorToken(): string | null {
    return localStorage.getItem('repartidor_token');
  }

  // Obtener los datos del repartidor
  getRepartidorData(): any | null {
    try {
      const repartidorData = localStorage.getItem('repartidor_data');
      console.log('getRepartidorData - Raw data from localStorage:', repartidorData);
      if (repartidorData) {
        const parsed = JSON.parse(repartidorData);
        console.log('getRepartidorData - Parsed data:', parsed);
        return parsed;
      }
      console.log('getRepartidorData - No data found in localStorage');
      return null;
    } catch (error) {
      console.error('Error al obtener datos del repartidor desde localStorage:', error);
      return null;
    }
  }

  // Obtener pedidos del día del repartidor
  async getPedidosDelDia(repartidorId?: number): Promise<{
    success: boolean;
    data?: {
      pedidos: any[];
      total: number;
      fecha: string;
    };
    error?: string;
  }> {
    try {
      const token = this.getRepartidorToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const config = getCurrentConfig();
      console.log(repartidorId, "repartidorId");
      
      // Agregar repartidor_id como query parameter si se proporciona
      const url = repartidorId 
        ? `${config.apiBaseUrl}/repartidores/mis-pedidos/del-dia?repartidor_id=${repartidorId}`
        : `${config.apiBaseUrl}/repartidores/mis-pedidos/del-dia`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Error al obtener pedidos',
        };
      }

      return data;
    } catch (error) {
      console.error('Error al obtener pedidos del día:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  }

  // Actualizar estado de un pedido
  async updateEstadoPedido(
    pedidoId: number,
    estado: 'pendiente' | 'en_camino' | 'en_ubicacion' | 'entregado' | 'no_entregado',
    notas?: string
  ): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const token = this.getRepartidorToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const config = getCurrentConfig();
      const response = await fetch(`${config.apiBaseUrl}/repartidores/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ estado, notas }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Error al actualizar estado',
        };
      }

      return data;
    } catch (error) {
      console.error('Error al actualizar estado del pedido:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  }
}

// Instancia singleton del servicio de repartidores
export const driversService = new DriversService();
