const TRANSITIONS = {
  pendiente: ['confirmado', 'no_entregado', 'cancelado'],
  confirmado: ['en_preparacion', 'no_entregado', 'cancelado'],
  en_preparacion: ['en_camino', 'cancelado'],
  en_camino: ['entregado', 'no_entregado', 'cancelado'],
  no_entregado: ['entregado'],
};

export function displayPhone(pedido) {
  const ref = String(pedido?.telefono_referencia || '').trim();
  if (ref) return ref;
  return String(pedido?.cliente?.telefono || pedido?.telefono || '').trim();
}

export function statusOptions(estado) {
  return TRANSITIONS[estado] || [];
}

export function pedidosPath({ ciudadId, repartidorId } = {}) {
  const params = new URLSearchParams();
  if (ciudadId) params.set('ciudadId', String(ciudadId));
  if (repartidorId) params.set('repartidorId', String(repartidorId));
  const query = params.toString();
  return query ? `/call-center/pedidos?${query}` : '/call-center/pedidos';
}

export function repartidoresPath(ciudadId) {
  return `/call-center/repartidores?ciudadId=${ciudadId}`;
}

export function shouldRefreshAfter(status) {
  return status === 409;
}

export function keepSelection(selectedId) {
  return selectedId ?? null;
}
