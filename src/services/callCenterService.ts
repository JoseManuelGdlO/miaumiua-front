import { config } from '@/config/environment';
import { authService } from '@/services/authService';
import { pedidosPath, repartidoresPath } from '@/lib/call-center-rules.mjs';

export type RepartidorRef = { id: number; nombre_completo: string } | null;

export type CargaLinea = {
  id?: number | null;
  fkid_producto?: number | null;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  es_extra: boolean;
};

export type ExtraLinea = {
  fkid_producto: number;
  cantidad: number;
  precio_unitario: number;
};

export type InventarioHit = {
  id: number;
  nombre: string;
  precio_venta: number;
};

export type Solicitud = {
  id: number;
  tipo: 'check_in' | 'llamada_cliente' | 'soporte' | 'cierre_dia';
  motivo: string | null;
  pedido_id: number | null;
  numero_pedido: string | null;
  repartidor: RepartidorRef;
  fecha: string;
  hora: string;
  prioridad: string;
  dinero_esperado?: number;
  espera_reenvio?: boolean;
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
  modificado?: boolean;
  cliente: string | null;
  telefono: string | null;
  direccion: string | null;
  notas?: string | null;
  franja?: "manana" | "tarde";
  orden_entrega?: number | null;
  repartidor: RepartidorRef;
  ciudad_id: number | null;
  comprobante_url: string | null;
};

export type RepartidorOpcion = { id: number; nombre_completo: string; estado: string };

export type VelocidadDia = {
  repartidor_id: number;
  nombre: string | null;
  promedio: number;
  lecturas: number;
};

export type CargaValidada = Solicitud & {
  validado_por_nombre: string | null;
};

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
  listCargasValidadas: () => request<CargaValidada[]>('/call-center/cargas-validadas'),
  getSolicitud: (id: number) => request<Solicitud>(`/call-center/solicitudes/${id}`),
  aprobar: (id: number) => request<{ atendida: boolean }>(`/call-center/solicitudes/${id}/aprobar`, { method: 'POST' }),
  guardarExtras: (id: number, lineas: ExtraLinea[]) => request<{ reenvio: boolean; cargas: CargaLinea[] }>(`/call-center/solicitudes/${id}/extras`, {
    method: 'PUT',
    body: JSON.stringify({ lineas }),
  }),
  buscarInventario: (q: string) => request<InventarioHit[]>(`/call-center/inventario?q=${encodeURIComponent(q)}`),
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
  liberarCierre: (id: number) => request<{ cerrada: boolean; cerrado_por_nombre: string | null }>(`/call-center/solicitudes/${id}/liberar-cierre`, {
    method: 'POST',
  }),
  reagendar: (id: number, fecha: string, motivo: string) => request<{ id: number }>(`/call-center/pedidos/${id}/reagendar`, {
    method: 'POST',
    body: JSON.stringify({ fecha, motivo }),
  }),
  cambiarFranja: (id: number, franja: "manana" | "tarde", alcance?: "ruta") => request<{ franja: string }>(`/call-center/pedidos/${id}/franja`, {
    method: 'POST',
    body: JSON.stringify(alcance ? { franja, alcance } : { franja }),
  }),
  liberarSiguiente: (id: number) => request<{ pedido_id: number; minutos: number | null }>(`/call-center/pedidos/${id}/liberar-siguiente`, {
    method: 'POST',
  }),
  listarVelocidad: () => request<VelocidadDia[]>('/call-center/velocidad'),
  moverParada: (id: number, direccion: "subir" | "bajar") => request<{ orden_entrega: number }>(`/call-center/pedidos/${id}/orden`, {
    method: 'POST',
    body: JSON.stringify({ direccion }),
  }),
};
