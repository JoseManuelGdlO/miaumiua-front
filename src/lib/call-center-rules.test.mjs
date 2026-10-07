import assert from 'node:assert/strict';
import test from 'node:test';
import {
  displayPhone,
  statusOptions,
  pedidosPath,
  repartidoresPath,
  shouldRefreshAfter,
  keepSelection,
} from './call-center-rules.mjs';

test('el teléfono prefiere la referencia', () => {
  assert.equal(displayPhone({ telefono_referencia: ' 618111 ', cliente: { telefono: '618222' } }), '618111');
  assert.equal(displayPhone({ telefono_referencia: '', cliente: { telefono: '618222' } }), '618222');
  assert.equal(displayPhone({}), '');
});

test('las transiciones son las de Pedidos', () => {
  assert.deepEqual(statusOptions('pendiente'), ['confirmado', 'no_entregado', 'cancelado']);
  assert.deepEqual(statusOptions('confirmado'), ['en_preparacion', 'no_entregado', 'cancelado']);
  assert.deepEqual(statusOptions('en_preparacion'), ['en_camino', 'cancelado']);
  assert.deepEqual(statusOptions('en_camino'), ['entregado', 'no_entregado', 'cancelado']);
  assert.deepEqual(statusOptions('no_entregado'), ['entregado']);
  assert.deepEqual(statusOptions('entregado'), []);
  assert.deepEqual(statusOptions('cancelado'), []);
});

test('los query no mandan filtros vacíos', () => {
  assert.equal(pedidosPath({}), '/call-center/pedidos');
  assert.equal(pedidosPath({ ciudadId: 2, repartidorId: 8 }), '/call-center/pedidos?ciudadId=2&repartidorId=8');
  assert.equal(repartidoresPath(7), '/call-center/repartidores?ciudadId=7');
});

test('solo un 409 refresca y la selección no se pierde', () => {
  assert.equal(shouldRefreshAfter(409), true);
  assert.equal(shouldRefreshAfter(422), false);
  assert.equal(keepSelection(9), 9);
  assert.equal(keepSelection(null), null);
});
