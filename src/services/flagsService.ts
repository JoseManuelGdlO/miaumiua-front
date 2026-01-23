import { config } from '../config/environment';
import { authService } from './authService';

export interface Flag {
	id: number;
	nombre: string;
	color: string;
	descripcion?: string;
	activo: boolean;
	baja_logica?: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface FlagsResponse {
	success: boolean;
	data: {
		flags: Flag[];
		pagination?: {
			total: number;
			page: number;
			limit: number;
			totalPages: number;
		};
	};
}

export interface FlagResponse {
	success: boolean;
	data: {
		flag: Flag;
	};
}

export interface FlagsQueryParams {
	activos?: string;
	activo?: string;
	search?: string;
	page?: number;
	limit?: number;
}

class FlagsService {
	private makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const token = localStorage.getItem('auth_token');
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		};

		if (token) {
			(headers as any)['Authorization'] = `Bearer ${token}`;
		}

		return fetch(`${config.apiBaseUrl}${endpoint}`, { ...options, headers })
			.then(async (response) => {
				if (!response.ok) {
					authService.handleAuthError(response);
					
					let message = `Error ${response.status}: ${response.statusText}`;
					try {
						const err = await response.json();
						message = err?.message || message;
					} catch {}
					throw new Error(message);
				}
				return response.json();
			});
	}

	// Listar flags
	async getFlags(params: FlagsQueryParams = {}): Promise<FlagsResponse> {
		const qs = new URLSearchParams();
		if (params.activos) qs.append('activos', params.activos);
		if (params.activo) qs.append('activo', params.activo);
		if (params.search) qs.append('search', params.search);
		if (params.page) qs.append('page', String(params.page));
		if (params.limit) qs.append('limit', String(params.limit));
		const query = qs.toString();
		return this.makeRequest<FlagsResponse>(`/conversaciones-flags${query ? `?${query}` : ''}`);
	}

	// Obtener flag por ID
	async getFlagById(id: number | string): Promise<FlagResponse> {
		return this.makeRequest<FlagResponse>(`/conversaciones-flags/${id}`);
	}

	// Crear flag
	async createFlag(data: { nombre: string; color?: string; descripcion?: string; activo?: boolean }): Promise<FlagResponse> {
		return this.makeRequest<FlagResponse>('/conversaciones-flags', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Actualizar flag
	async updateFlag(id: number | string, data: { nombre?: string; color?: string; descripcion?: string; activo?: boolean }): Promise<FlagResponse> {
		return this.makeRequest<FlagResponse>(`/conversaciones-flags/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	// Eliminar flag
	async deleteFlag(id: number | string): Promise<{ success: boolean; message: string }> {
		return this.makeRequest<{ success: boolean; message: string }>(`/conversaciones-flags/${id}`, {
			method: 'DELETE',
		});
	}

	// Restaurar flag
	async restoreFlag(id: number | string): Promise<FlagResponse> {
		return this.makeRequest<FlagResponse>(`/conversaciones-flags/${id}/restore`, {
			method: 'PATCH',
		});
	}

	// Asignar flag a conversación
	async assignFlag(flagId: number | string, conversacionId: number | string): Promise<{ success: boolean; message: string; data: any }> {
		return this.makeRequest<{ success: boolean; message: string; data: any }>(`/conversaciones-flags/${flagId}/asignar/${conversacionId}`, {
			method: 'POST',
		});
	}

	// Remover flag de conversación
	async removeFlag(flagId: number | string, conversacionId: number | string): Promise<{ success: boolean; message: string }> {
		return this.makeRequest<{ success: boolean; message: string }>(`/conversaciones-flags/${flagId}/asignar/${conversacionId}`, {
			method: 'DELETE',
		});
	}

	// Obtener flags de una conversación
	async getConversationFlags(conversacionId: number | string): Promise<{ success: boolean; data: { flags: Flag[] } }> {
		return this.makeRequest<{ success: boolean; data: { flags: Flag[] } }>(`/conversaciones/${conversacionId}/flags`);
	}
}

export const flagsService = new FlagsService();
