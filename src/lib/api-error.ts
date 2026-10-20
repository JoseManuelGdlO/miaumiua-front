function textos(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item !== '');
}

export function textoDeError(body: unknown): string {
  if (!body || typeof body !== 'object') return 'No se pudo completar la solicitud';
  const record = body as Record<string, unknown>;
  const errors = textos(record.errors);
  const message = typeof record.message === 'string' && record.message.trim()
    ? record.message.trim()
    : typeof record.error === 'string' && record.error.trim()
      ? record.error.trim()
      : '';
  if (message && errors.length) return `${message}. ${errors.join('. ')}`;
  if (message) return message;
  if (errors.length) return errors.join('. ');
  return 'No se pudo completar la solicitud';
}

export async function mensajeDeError(response: Response): Promise<string> {
  try {
    return textoDeError(await response.json());
  } catch {
    return 'No se pudo completar la solicitud';
  }
}
