import { authService } from './authService';

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
  data: Driver;
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

// Clase para manejar los repartidores
class DriversService {
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
}

// Instancia singleton del servicio de repartidores
export const driversService = new DriversService();
