import { config } from '../config/environment';
import { authService } from './authService';

export function resolveChatImageUrl(url: string | null | undefined): string {
	if (!url) return '';
	if (url.startsWith('http://') || url.startsWith('https://')) return url;
	return `${config.imageBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

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
		cerradas?: number;
		errores?: number;
		escaladas?: number;
		resueltas_hoy?: number;
		conversacionesActivas?: number;
		conversacionesCerradas?: number;
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

export type ConversationStatus =
	| 'activa'
	| 'pausada'
	| 'cerrada'
	| 'en_espera';

export interface ConversationsQueryParams {
	status?: ConversationStatus;
	has_error?: boolean;
	has_escalation?: boolean;
	page?: number;
	limit?: number;
	search?: string;
	flags?: number[];
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
		if (params.has_error) qs.append('has_error', 'true');
		if (params.has_escalation) qs.append('has_escalation', 'true');
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

	// Stats; optional search/flags scope when the API supports them
	async getStats(
		params: Pick<ConversationsQueryParams, 'search' | 'flags'> = {}
	): Promise<ConversationStatsResponse> {
		const qs = new URLSearchParams();
		if (params.search) qs.append('search', params.search);
		if (params.flags && params.flags.length > 0) {
			qs.append('flags', params.flags.join(','));
		}
		const query = qs.toString();
		return this.makeRequest<ConversationStatsResponse>(
			`/conversaciones/stats${query ? `?${query}` : ''}`,
			{
				headers: {},
			}
		);
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

	async sendWhatsAppImage(
		conversacionId: number | string,
		file: File,
		caption?: string
	): Promise<ConversationChatResponse> {
		const formData = new FormData();
		formData.append('conversacionId', String(conversacionId));
		formData.append('imagen', file);
		if (caption?.trim()) {
			formData.append('caption', caption.trim());
		}

		const token = localStorage.getItem('auth_token');
		const headers: HeadersInit = {};
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		const response = await fetch(`${config.apiBaseUrl}/mensajeria/send-whatsapp-image`, {
			method: 'POST',
			headers,
			body: formData,
		});

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


