import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, LoginCredentials, LoginResponse } from '@/services/authService';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  const navigate = useNavigate();

  // Verificar autenticación al cargar el hook
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authService.isAuthenticated();
      const user = authService.getUserData();
      
      setAuthState({
        isAuthenticated,
        isLoading: false,
        user,
        error: null,
      });
    };

    checkAuth();
  }, []);

  // Función para hacer login
  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.login(credentials);

      if (response.success) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: response.data?.user || null,
          error: null,
        });
        
        // Redirigir al dashboard después del login exitoso
        navigate('/dashboard');
      } else {
        // Asegurar que el error se muestre correctamente
        const errorMessage = response.error || 'Credenciales incorrectas. Verifica tu email y contraseña.';
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión. Verifica tu conexión a internet.';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Función para hacer logout
  const logout = () => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
    navigate('/login');
  };

  // Función para limpiar errores
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    ...authState,
    login,
    logout,
    clearError,
  };
};
