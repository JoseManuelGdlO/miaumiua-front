import { config } from '../config/environment';

// Interfaces para Mascotas
export interface Pet {
  id: number;
  nombre: string;
  edad?: number;
  genero?: 'macho' | 'hembra';
  raza?: string;
  producto_preferido?: string;
  puntos_lealtad: number;
  notas_especiales?: string;
  fkid_cliente: number;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePetData {
  nombre: string;
  edad?: number;
  genero?: 'macho' | 'hembra';
  raza?: string;
  producto_preferido?: string;
  notas_especiales?: string;
  fkid_cliente: number;
}

export interface UpdatePetData {
  nombre?: string;
  edad?: number;
  genero?: 'macho' | 'hembra';
  raza?: string;
  producto_preferido?: string;
  notas_especiales?: string;
}

export interface PetResponse {
  success: boolean;
  data: {
    mascota: Pet;
  };
}

export interface PetsResponse {
  success: boolean;
  data: {
    mascotas: Pet[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface PetsQueryParams {
  fkid_cliente?: number;
  genero?: 'macho' | 'hembra';
  raza?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class PetsService {
  private makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de acceso requerido');
    }

    const requestConfig: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    return fetch(`${config.apiBaseUrl}${endpoint}`, requestConfig)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      });
  }

  async getAllPets(params: PetsQueryParams = {}): Promise<PetsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.fkid_cliente) queryParams.append('fkid_cliente', params.fkid_cliente.toString());
    if (params.genero) queryParams.append('genero', params.genero);
    if (params.raza) queryParams.append('raza', params.raza);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/mascotas${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<PetsResponse>(endpoint);
  }

  async getPetById(id: number): Promise<PetResponse> {
    return this.makeRequest<PetResponse>(`/mascotas/${id}`);
  }

  async createPet(data: CreatePetData): Promise<PetResponse> {
    return this.makeRequest<PetResponse>('/mascotas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePet(id: number, data: UpdatePetData): Promise<PetResponse> {
    return this.makeRequest<PetResponse>(`/mascotas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePet(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/mascotas/${id}`, {
      method: 'DELETE',
    });
  }

  async getPetsByClientId(clientId: number): Promise<PetsResponse> {
    return this.getAllPets({ fkid_cliente: clientId, isActive: true });
  }
}

export const petsService = new PetsService();
