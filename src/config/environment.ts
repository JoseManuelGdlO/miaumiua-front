// Configuración de entorno para la aplicación
export const config = {
  // URLs base del API según el entorno
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://bots-asistente-backend.vvggha.easypanel.host/api',
  
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
  apiBaseUrl: 'https://bots-asistente-backend.vvggha.easypanel.host/api',
  timeout: 10000, // 10 segundos
  retryAttempts: 3,
};

// Configuraciones específicas para producción
export const prodConfig = {
  apiBaseUrl: 'https://bots-asistente-backend.vvggha.easypanel.host/api',
  timeout: 15000, // 15 segundos
  retryAttempts: 2,
};

// Función para obtener la configuración actual
export const getCurrentConfig = () => {
  return config.isDevelopment ? devConfig : prodConfig;
};
