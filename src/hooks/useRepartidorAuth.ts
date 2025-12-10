import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driversService, RepartidorLoginCredentials, RepartidorLoginResponse } from '@/services/driversService';

export interface RepartidorAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  repartidor: any | null;
  error: string | null;
}

export const useRepartidorAuth = () => {
  const [authState, setAuthState] = useState<RepartidorAuthState>({
    isAuthenticated: false,
    isLoading: true,
    repartidor: null,
    error: null,
  });

  const navigate = useNavigate();

  // Verificar autenticación al cargar el hook
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('repartidor_token');
        const repartidorData = localStorage.getItem('repartidor_data');
        
        console.log('=== useRepartidorAuth - Verificando autenticación ===');
        console.log('Token en localStorage:', token ? '✓ Existe' : '✗ No existe');
        console.log('Datos en localStorage:', repartidorData ? '✓ Existe' : '✗ No existe');
        
        const isAuthenticated = driversService.isRepartidorAuthenticated();
        const repartidor = driversService.getRepartidorData();
        
        console.log('isAuthenticated:', isAuthenticated);
        console.log('repartidor desde localStorage:', repartidor);
        
        if (repartidor) {
          console.log('ID del repartidor:', repartidor.id);
          console.log('Nombre:', repartidor.nombre_completo);
          console.log('Email:', repartidor.email);
        }
        console.log('=== FIN VERIFICACIÓN ===');
        
        setAuthState({
          isAuthenticated,
          isLoading: false,
          repartidor,
          error: null,
        });
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          repartidor: null,
          error: null,
        });
      }
    };

    checkAuth();
  }, []);

  // Función para hacer login
  const login = async (credentials: RepartidorLoginCredentials): Promise<RepartidorLoginResponse> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await driversService.loginRepartidor(credentials);

      if (response.success) {
        // Esperar un momento para asegurar que los datos se guardaron
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Obtener los datos del repartidor desde localStorage (ya fueron guardados por el servicio)
        const repartidorData = driversService.getRepartidorData();
        
        console.log('=== LOGIN EXITOSO ===');
        console.log('Datos del repartidor desde localStorage:', repartidorData);
        console.log('Datos del repartidor desde response:', response.data?.repartidor);
        
        const finalRepartidorData = repartidorData || response.data?.repartidor || null;
        
        if (finalRepartidorData) {
          console.log('ID del repartidor:', finalRepartidorData.id);
          console.log('Nombre:', finalRepartidorData.nombre_completo);
          console.log('Email:', finalRepartidorData.email);
        } else {
          console.error('ERROR: No se pudieron obtener los datos del repartidor');
        }
        console.log('=== FIN LOGIN ===');
        
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          repartidor: finalRepartidorData,
          error: null,
        });
        
        // Redirigir después del login exitoso
        navigate('/repartidores/dashboard');
      } else {
        const errorMessage = response.error || 'Credenciales incorrectas. Verifica tus datos.';
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
    driversService.logoutRepartidor();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      repartidor: null,
      error: null,
    });
    navigate('/repartidores/login');
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
