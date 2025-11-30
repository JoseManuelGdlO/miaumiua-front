// Función helper para normalizar la URL base del API
const normalizeApiUrl = (url: string | undefined): string => {
  if (!url) return 'http://localhost:3000/api';
  // Si ya tiene protocolo, usarlo tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Si no tiene protocolo, agregar http://
  return `http://${url}`;
};

// Configuración de entorno para la aplicación
export const config = {
  // URLs base del API según el entorno (normalizada con protocolo)
  apiBaseUrl: normalizeApiUrl(import.meta.env.VITE_API_BASE_URL || 'localhost:3000/api'),
  
  // Información de la aplicación
  appName: import.meta.env.VITE_APP_NAME || 'Miau Miau Control Center',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  
  // Configuraciones específicas por entorno
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Configuraciones específicas para desarrollo
export const devConfig = {
  apiBaseUrl: normalizeApiUrl('localhost:3000/api'),
  timeout: 10000, // 10 segundos
  retryAttempts: 3,
};

// Configuraciones específicas para producción
export const prodConfig = {
  apiBaseUrl: normalizeApiUrl('localhost:3000/api'),
  timeout: 15000, // 15 segundos
  retryAttempts: 2,
};

// Función para obtener la configuración actual
export const getCurrentConfig = () => {
  return config.isDevelopment ? devConfig : prodConfig;
};
