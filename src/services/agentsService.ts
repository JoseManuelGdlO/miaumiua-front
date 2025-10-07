import { authService } from './authService';

// Interfaces para los datos de agentes
export interface AgentPersonality {
  tono?: string;
  estilo?: string;
  empatia?: string;
  paciencia?: string;
}

export interface AgentConfiguration {
  max_tokens?: number;
  temperature?: number;
  modelo?: string;
  timeout?: number;
}

export interface Agent {
  id: number;
  nombre: string;
  descripcion: string;
  especialidad: string;
  contexto: string;
  system_prompt: string;
  personalidad: AgentPersonality;
  configuracion: AgentConfiguration;
  estado: 'activo' | 'inactivo' | 'mantenimiento';
  orden_prioridad: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAgentData {
  nombre: string;
  descripcion: string;
  especialidad: string;
  contexto: string;
  system_prompt: string;
  personalidad: AgentPersonality;
  configuracion: AgentConfiguration;
  orden_prioridad?: number;
}

export interface UpdateAgentData {
  nombre?: string;
  descripcion?: string;
  especialidad?: string;
  contexto?: string;
  system_prompt?: string;
  personalidad?: AgentPersonality;
  configuracion?: AgentConfiguration;
  orden_prioridad?: number;
}

export interface ChangeAgentStatusData {
  estado: 'activo' | 'inactivo' | 'mantenimiento';
}

export interface AgentConversation {
  id: number;
  fkid_agente: number;
  fkid_conversacion: number;
  fecha_asignacion: string;
  rendimiento?: number;
  feedback?: string;
  conversacion: {
    id: number;
    status: string;
    cliente: {
      nombre_completo: string;
    };
  };
}

export interface UpdatePerformanceData {
  rendimiento: number;
  feedback?: string;
}

export interface AgentsResponse {
  success: boolean;
  data: {
    agentes: Agent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AgentResponse {
  success: boolean;
  data: Agent;
  message?: string;
}

export interface AgentConversationsResponse {
  success: boolean;
  data: {
    agente: {
      id: number;
      nombre: string;
    };
    conversaciones: AgentConversation[];
    total_conversaciones: number;
    rendimiento_promedio: number;
  };
}

export interface AgentStatsResponse {
  success: boolean;
  data: {
    total_agentes: number;
    agentes_activos: number;
    agentes_inactivos: number;
    agentes_mantenimiento: number;
    especialidades: Record<string, number>;
    conversaciones_totales: number;
    rendimiento_promedio: number;
  };
}

class AgentsService {
  private baseUrl = '/agentes';

  // Obtener todos los agentes con filtros
  async getAllAgents(params: {
    page?: number;
    limit?: number;
    estado?: string;
    especialidad?: string;
    activos?: boolean;
    search?: string;
  } = {}): Promise<AgentsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.especialidad) queryParams.append('especialidad', params.especialidad);
    if (params.activos !== undefined) queryParams.append('activos', params.activos.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = `${this.baseUrl}?${queryParams.toString()}`;
    return authService.authenticatedRequest(url);
  }

  // Obtener agente por ID
  async getAgentById(id: number): Promise<AgentResponse> {
    return authService.authenticatedRequest(`${this.baseUrl}/${id}`);
  }

  // Crear nuevo agente
  async createAgent(data: CreateAgentData): Promise<AgentResponse> {
    return authService.authenticatedRequest(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  // Actualizar agente
  async updateAgent(id: number, data: UpdateAgentData): Promise<AgentResponse> {
    return authService.authenticatedRequest(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  // Cambiar estado del agente
  async changeAgentStatus(id: number, data: ChangeAgentStatusData): Promise<AgentResponse> {
    return authService.authenticatedRequest(`${this.baseUrl}/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  // Eliminar agente (soft delete)
  async deleteAgent(id: number): Promise<{ success: boolean; message: string }> {
    return authService.authenticatedRequest(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  // Restaurar agente
  async restoreAgent(id: number): Promise<AgentResponse> {
    return authService.authenticatedRequest(`${this.baseUrl}/${id}/restore`, {
      method: 'PATCH',
    });
  }

  // Obtener agentes por especialidad
  async getAgentsBySpecialty(especialidad: string): Promise<{ success: boolean; data: Agent[] }> {
    return authService.authenticatedRequest(`${this.baseUrl}/especialidad/${especialidad}`);
  }

  // Obtener conversaciones del agente
  async getAgentConversations(id: number): Promise<AgentConversationsResponse> {
    return authService.authenticatedRequest(`${this.baseUrl}/${id}/conversaciones`);
  }

  // Actualizar rendimiento de conversación
  async updateConversationPerformance(conversationId: number, data: UpdatePerformanceData): Promise<AgentResponse> {
    return authService.authenticatedRequest(`${this.baseUrl}/conversaciones/${conversationId}/rendimiento`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  // Obtener agentes activos (público)
  async getActiveAgents(): Promise<{ success: boolean; data: Agent[] }> {
    return authService.makeRequest(`${this.baseUrl}/activos`);
  }

  // Obtener estadísticas (público)
  async getAgentStats(): Promise<AgentStatsResponse> {
    return authService.makeRequest(`${this.baseUrl}/estadisticas`);
  }
}

export const agentsService = new AgentsService();
