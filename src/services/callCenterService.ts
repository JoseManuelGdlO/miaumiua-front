import { config } from '@/config/environment';
import { falloHttp } from '@/lib/api-error';
import { authService } from '@/services/authService';
import { pedidosPath, repartidoresPath } from '@/lib/call-center-rules.mjs';

export type RepartidorRef = { id: number; nombre_completo: string; telefono?: string | null } | null;

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
  efectivo_a_depositar?: number;
  comprobante_url?: string | null;
  motivo: string | null;
  ayuda?: string | null;
  pedido_id: number | null;
  numero_pedido: string | null;
  repartidor: RepartidorRef;
  fecha: string;
  hora: string;
  de_hoy?: boolean;
  espera_desde?: string;
  prioridad: string;
  dinero_esperado?: number;
  espera_reenvio?: boolean;
  ya_validada?: boolean;
  cargas?: CargaLinea[];
  pedidos?: { numero_pedido: string; cliente: string; productos: { nombre: string; cantidad: number }[] }[];
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
  horario_preferente?: string | null;
  metodo_pago?: string | null;
  orden_entrega?: number | null;
  repartidor: RepartidorRef;
  ciudad_id: number | null;
  total: number;
  comprobante_url: string | null;
};

export type RepartidorOpcion = { id: number; nombre_completo: string; estado: string };

export type ComprobantePago = {
  pedido_id: number;
  numero_pedido: string;
  repartidor: string | null;
  ciudad?: string | null;
  metodo: string;
  nota?: string | null;
  fecha?: string | null;
  comprobante_url: string | null;
  puede_subir: boolean;
};

export type DepositoRuta = {
  jornada_id: number;
  repartidor: string | null;
  efectivo_a_depositar: number;
  comprobante_url: string | null;
};

export type ActividadDisponible = {
  id: number;
  numero_pedido: string;
  cliente: string | null;
  ciudad_id: number | null;
};

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
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    authService.handleAuthError(response);
    const body = await response.json().catch(() => ({}));
    throw falloHttp(response, body);
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
  resolverAyuda: (id: number, accion: "ver_codigo" | "aprobar_codigo" | "autorizar_tercero", receptor?: string) => request<{ codigo?: string; aprobado?: boolean; autorizado?: boolean }>(`/call-center/solicitudes/${id}/ayuda`, {
    method: "POST",
    body: JSON.stringify({ accion, ...(receptor ? { receptor } : {}) }),
  }),
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
  responder: (repartidorId: number, texto: string) => request<{ enviado: boolean }>(`/call-center/repartidores/${repartidorId}/mensaje`, {
    method: 'POST',
    body: JSON.stringify({ texto }),
  }),
  cierreDirecto: (repartidorId: number) => request<{ cerrada: boolean; cerrado_por_nombre: string | null }>(`/call-center/repartidores/${repartidorId}/cierre-directo`, {
    method: 'POST',
  }),
  listContactos: () => request<{ personas: { id: number; nombre: string; telefono: string; repartidor_ids: number[]; numeros?: { telefono: string; repartidor_ids: number[] }[] }[]; repartidores: { id: number; nombre: string }[] }>('/call-center/contactos'),
  guardarContacto: (usuarioId: number, numeros: { telefono: string; repartidor_ids: number[] }[]) => request<{ guardado: boolean }>(`/call-center/contactos/${usuarioId}`, {
    method: 'PUT',
    body: JSON.stringify({ numeros }),
  }),
  reagendar: (id: number, fecha: string, motivo: string) => request<{ id: number }>(`/call-center/pedidos/${id}/reagendar`, {
    method: 'POST',
    body: JSON.stringify({ fecha, motivo }),
  }),
  cambiarDireccion: (id: number, direccion: string) => request<{ direccion_entrega: string }>(`/call-center/pedidos/${id}/direccion`, {
    method: 'POST',
    body: JSON.stringify({ direccion }),
  }),
  cambiarFranja: (id: number, franja: "manana" | "tarde", alcance?: "ruta") => request<{ franja: string }>(`/call-center/pedidos/${id}/franja`, {
    method: 'POST',
    body: JSON.stringify(alcance ? { franja, alcance } : { franja }),
  }),
  liberarSiguiente: (id: number) => request<{ pedido_id: number; minutos: number | null }>(`/call-center/pedidos/${id}/liberar-siguiente`, {
    method: 'POST',
  }),
  listarVelocidad: () => request<VelocidadDia[]>('/call-center/velocidad'),
  listarComprobantes: (query?: { historico?: boolean }) => request<ComprobantePago[]>(`/call-center/comprobantes${query?.historico ? '?historico=1' : ''}`),
  anotarComprobante: (id: number, comentario: string) => request<{ guardado: boolean }>(`/call-center/pedidos/${id}/comprobante-nota`, {
    method: 'POST',
    body: JSON.stringify({ comentario }),
  }),
  subirComprobante: (id: number, file: File) => {
    const body = new FormData();
    body.append('comprobante', file);
    return request<{ comprobante_url: string }>(`/call-center/pedidos/${id}/comprobante`, { method: 'POST', body });
  },
  listarDepositos: () => request<DepositoRuta[]>('/call-center/depositos'),
  listarActividades: (ciudadId?: number) => request<ActividadDisponible[]>(
    `/call-center/actividades${ciudadId ? `?ciudadId=${ciudadId}` : ''}`,
  ),
  asignarActividad: (pedidoId: number, fkid_repartidor: number) => request<{ ruta_id: number }>(`/call-center/actividades`, {
    method: 'POST',
    body: JSON.stringify({ pedido_id: pedidoId, fkid_repartidor }),
  }),
  cerrarSinCodigo: (id: number, motivo: string) => request<{ id: number; estado: string }>(`/call-center/pedidos/${id}/cerrar-sin-codigo`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  }),
  moverParada: (id: number, direccion: "subir" | "bajar") => request<{ orden_entrega: number }>(`/call-center/pedidos/${id}/orden`, {
    method: 'POST',
    body: JSON.stringify({ direccion }),
  }),
};
