import { config } from '../config/environment';
import { authService } from './authService';

export interface Conversation {
	id: number;
	title?: string;
	status: string; // e.g., activa, pendiente, resuelto, error, escalado
	last_message?: string;
	updated_at?: string;
	customer_name?: string;
	unread?: number;
	flags?: Array<{
		id: number;
		nombre: string;
		color: string;
		descripcion?: string;
		activo: boolean;
	}>;
}

export interface ConversationsResponse {
	success: boolean;
	data: {
		conversaciones: Conversation[];
		pagination?: {
			total: number;
			page: number;
			limit: number;
			totalPages: number;
		};
	};
}

export interface ConversationResponse {
	success: boolean;
	data: {
		conversacion: Conversation;
	};
}

export interface ConversationStatsResponse {
	success: boolean;
	data: Record<string, number> & {
		activas?: number;
		pendientes?: number;
		errores?: number;
		escaladas?: number;
		resueltas_hoy?: number;
	};
}

export interface ConversationChatResponse {
	success: boolean;
	message?: string;
	data: {
		chat: any;
	};
}

export interface ConversationChatsResponse {
	success: boolean;
	data: {
		chats: any[];
		pagination?: {
			total: number;
			page: number;
			limit: number;
			totalPages: number;
		};
	};
}

export interface ConversationsQueryParams {
	status?: string; // activa | pendiente | resuelto | error | escalado
	page?: number;
	limit?: number;
	search?: string;
	flags?: number[]; // Array de IDs de flags para filtrar
}

class ConversationsService {
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
					// Manejar errores de autenticación (401/403) y desloguear automáticamente
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

	// Authenticated: list conversations
	async getConversations(params: ConversationsQueryParams = {}): Promise<ConversationsResponse> {
		const qs = new URLSearchParams();
		if (params.status) qs.append('status', params.status);
		if (params.page) qs.append('page', String(params.page));
		if (params.limit) qs.append('limit', String(params.limit));
		if (params.search) qs.append('search', params.search);
		if (params.flags && params.flags.length > 0) {
			qs.append('flags', params.flags.join(','));
		}
		const query = qs.toString();
		return this.makeRequest<ConversationsResponse>(`/conversaciones${query ? `?${query}` : ''}`);
	}

	// Authenticated: conversation detail
	async getConversationById(id: number | string): Promise<ConversationResponse> {
		return this.makeRequest<ConversationResponse>(`/conversaciones/${id}`);
	}

	// Public: stats
	async getStats(): Promise<ConversationStatsResponse> {
		return this.makeRequest<ConversationStatsResponse>('/conversaciones/stats', {
			headers: {}, // ensures no auth header required
		});
	}

	// Public: active conversations
	async getActive(): Promise<ConversationsResponse> {
		return this.makeRequest<ConversationsResponse>('/conversaciones/active', {
			headers: {},
		});
	}

	// Authenticated: send WhatsApp message for a conversation
	async sendWhatsAppMessage(conversacionId: number | string, mensaje: string): Promise<ConversationChatResponse> {
		return this.makeRequest<ConversationChatResponse>('/mensajeria/send-whatsapp', {
			method: 'POST',
			body: JSON.stringify({ conversacionId, mensaje }),
		});
	}

	// Authenticated: conversation chats with pagination
	async getConversationChats(conversacionId: number | string, page = 1, limit = 10): Promise<ConversationChatsResponse> {
		const qs = new URLSearchParams();
		qs.append('fkid_conversacion', String(conversacionId));
		qs.append('page', String(page));
		qs.append('limit', String(limit));
		qs.append('activos', 'true');
		return this.makeRequest<ConversationChatsResponse>(`/conversaciones-chat?${qs.toString()}`);
	}

	// Authenticated: update conversation status
	async updateConversationStatus(id: number, status: string): Promise<ConversationResponse> {
		return this.makeRequest<ConversationResponse>(`/conversaciones/${id}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ status }),
		});
	}
}

export const conversationsService = new ConversationsService();


