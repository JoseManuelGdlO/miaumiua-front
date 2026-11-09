export const MAX_PARADAS_DIA = 25;

export function textoCupo(n: number) {
  const total = Number(n) || 0;
  if (total >= MAX_PARADAS_DIA) return `${total} de ${MAX_PARADAS_DIA} · Saturado`;
  return `${total} de ${MAX_PARADAS_DIA}`;
}
