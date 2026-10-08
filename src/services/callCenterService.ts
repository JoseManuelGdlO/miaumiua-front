import { config } from '@/config/environment';
import { authService } from '@/services/authService';
import { pedidosPath, repartidoresPath } from '@/lib/call-center-rules.mjs';

export type RepartidorRef = { id: number; nombre_completo: string } | null;

export type CargaLinea = {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  es_extra: boolean;
};

export type Solicitud = {
  id: number;
  tipo: 'check_in' | 'llamada_cliente' | 'soporte';
  motivo: string | null;
  pedido_id: number | null;
  numero_pedido: string | null;
  repartidor: RepartidorRef;
  fecha: string;
  hora: string;
  prioridad: string;
  cargas?: CargaLinea[];
  cliente?: string | null;
  telefono?: string | null;
  direccion?: string | null;
};

export type PedidoDia = {
  id: number;
  ruta_pedido_id: number;
  numero_pedido: string;
  estado: string;
  estado_entrega: string;
  cliente: string | null;
  telefono: string | null;
  direccion: string | null;
  repartidor: RepartidorRef;
  ciudad_id: number | null;
};

export type RepartidorOpcion = { id: number; nombre_completo: string; estado: string };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authService.getToken();
  if (!token) {
    const error = new Error('Token de acceso requerido') as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    authService.handleAuthError(response);
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || `Error ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  return payload.data as T;
}

export const callCenterService = {
  listSolicitudes: () => request<Solicitud[]>('/call-center/solicitudes'),
  getSolicitud: (id: number) => request<Solicitud>(`/call-center/solicitudes/${id}`),
  aprobar: (id: number) => request<{ atendida: boolean }>(`/call-center/solicitudes/${id}/aprobar`, { method: 'POST' }),
  atender: (id: number, nota?: string) => request<{ atendida: boolean }>(`/call-center/solicitudes/${id}/atender`, {
    method: 'POST',
    body: JSON.stringify(nota ? { nota } : {}),
  }),
  listPedidos: (filters: { ciudadId?: number; repartidorId?: number }) => request<PedidoDia[]>(pedidosPath(filters)),
  cambiarEstado: (id: number, estado: string) => request<{ id: number; estado: string }>(`/call-center/pedidos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  }),
  listRepartidores: (ciudadId: number) => request<RepartidorOpcion[]>(repartidoresPath(ciudadId)),
  reasignar: (id: number, fkid_repartidor: number) => request<{ ruta_id: number }>(`/call-center/pedidos/${id}/reasignar`, {
    method: 'POST',
    body: JSON.stringify({ fkid_repartidor }),
  }),
};
