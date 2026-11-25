import { config } from '../config/environment';
import { mensajeDeError } from '@/lib/api-error';
import { authService } from './authService';

export interface ConversacionLogEntry {
	id: number;
	fkid_conversacion: number;
	fecha: string;
	hora: string;
	data: Record<string, unknown>;
	tipo_log: string;
	nivel: string;
	descripcion?: string | null;
	created_at?: string;
}

export interface ConversationLogsResponse {
	success: boolean;
	data: {
		logs: ConversacionLogEntry[];
		total: number;
		conversacionId: number;
	};
}

class ConversationLogsService {
	private makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const token = localStorage.getItem('auth_token');
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		};

		if (token) {
			(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
		}

		return fetch(`${config.apiBaseUrl}${endpoint}`, { ...options, headers }).then(async (response) => {
			if (!response.ok) {
				authService.handleAuthError(response);
				throw new Error(await mensajeDeError(response));
			}
			return response.json();
		});
	}

	getLogsByConversacion(conversacionId: number | string): Promise<ConversationLogsResponse> {
		return this.makeRequest<ConversationLogsResponse>(
			`/conversaciones-logs/conversacion/${conversacionId}`
		);
	}
}

export const conversationLogsService = new ConversationLogsService();
