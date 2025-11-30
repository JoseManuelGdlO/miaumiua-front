import { config } from '../config/environment';
import { authService } from './authService';

const API_BASE_URL = config.apiBaseUrl;

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodeResponse {
  success: boolean;
  data: {
    lat: number;
    lng: number;
    formatted_address?: string;
  };
}

interface DistanceMatrixResponse {
  success: boolean;
  data: {
    matrix: Array<Array<{
      distance: number | null; // en km
      duration: number | null; // en minutos
      status: string;
    }>>;
    origin_addresses: string[];
    destination_addresses: string[];
  };
}

interface GeocodeMultipleResponse {
  success: boolean;
  data: Array<{
    address: string;
    success: boolean;
    lat?: number;
    lng?: number;
    formatted_address?: string;
    error?: string;
  }>;
}

class MapsService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `Error ${response.status}`);
    }

    return response.json();
  }

  async geocodeAddress(address: string, estado?: string, ciudad?: string): Promise<GeocodeResponse> {
    return this.request<GeocodeResponse>('/maps/geocode', {
      method: 'POST',
      body: JSON.stringify({ address, estado, ciudad }),
    });
  }

  async geocodeMultipleAddresses(addresses: string[]): Promise<GeocodeMultipleResponse> {
    return this.request<GeocodeMultipleResponse>('/maps/geocode-multiple', {
      method: 'POST',
      body: JSON.stringify({ addresses }),
    });
  }

  async calculateDistanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<DistanceMatrixResponse> {
    return this.request<DistanceMatrixResponse>('/maps/distance-matrix', {
      method: 'POST',
      body: JSON.stringify({ origins, destinations }),
    });
  }
}

export const mapsService = new MapsService();

