import { getCurrentConfig } from '@/config/environment';

// Tipos para la autenticación
export interface LoginCredentials {
  correo_electronico: string;
  contrasena: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    refreshToken: string;
    user: {
      id: number;
      nombre_completo: string;
      correo_electronico: string;
      rol: {
        id: number;
        nombre: string;
        descripcion: string;
      };
      isActive: boolean;
      lastLogin: string;
    };
    permissions: string[];
  };
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Clase para manejar la autenticación
class AuthService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    const config = getCurrentConfig();
    this.baseUrl = config.apiBaseUrl;
    this.timeout = config.timeout;
  }

  // Función para hacer peticiones HTTP con timeout y manejo de errores
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Manejar errores de autenticación (401/403) antes de procesar el error
        this.handleAuthError(response);
        
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Manejar errores de validación (400)
        if (response.status === 400) {
          // Si hay errores de validación, mostrar el mensaje específico
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((err: any) => err.msg || err.message).join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage = 'Errores de validación';
          }
        } else if (response.status === 401) {
          errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else if (response.status === 403) {
          errorMessage = 'Acceso denegado. Tu cuenta puede estar desactivada.';
        } else if (response.status === 404) {
          errorMessage = 'Usuario no encontrado.';
        } else if (response.status >= 500) {
          errorMessage = 'Error del servidor. Inténtalo más tarde.';
        }
        
        const error = new Error(errorMessage);
        (error as any).response = {
          status: response.status,
          data: errorData
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('La petición tardó demasiado tiempo. Inténtalo de nuevo.');
        }
        throw error;
      }
      
      throw new Error('Error de conexión. Verifica tu conexión a internet.');
    }
  }

  // Función para hacer login
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await this.makeRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Si el login es exitoso, guardar el token y refreshToken en localStorage
      if (response.success && response.data?.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        localStorage.setItem('user_permissions', JSON.stringify(response.data.permissions));
      }

      return response;
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // Función para hacer logout
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_permissions');
  }

  // Función para manejar errores de autenticación (401/403) y desloguear automáticamente
  handleAuthError(response: Response): void {
    if (response.status === 401 || response.status === 403) {
      // Desloguear al usuario
      this.logout();
      
      // Redirigir a la página de login
      // Usar window.location para redirigir fuera del contexto de React Router
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  // Función para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  // Función para obtener el token de autenticación
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Función para obtener el refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Función para obtener los datos del usuario
  getUserData(): any | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  // Función para obtener los permisos del usuario
  getUserPermissions(): string[] {
    const permissions = localStorage.getItem('user_permissions');
    return permissions ? JSON.parse(permissions) : [];
  }

  // Función para hacer peticiones autenticadas
  async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }

    return this.makeRequest<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Función helper para procesar respuestas HTTP y manejar errores de autenticación
  // Esta función puede ser usada por otros servicios para manejar respuestas de manera consistente
  async processResponse<T>(response: Response): Promise<T> {
    // Manejar errores de autenticación antes de procesar
    this.handleAuthError(response);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }
    
    return await response.json();
  }
}

// Instancia singleton del servicio de autenticación
export const authService = new AuthService();
