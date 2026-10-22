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

const FRASES: Record<number, string> = {
  400: 'Los datos enviados no son válidos.',
  401: 'La sesión venció o no tienes acceso. Vuelve a entrar.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No se encontró lo que se estaba buscando.',
  408: 'El servidor tardó demasiado en contestar.',
  409: 'Esa acción no se puede hacer con el estado actual.',
  422: 'Faltan datos o algún dato no es válido.',
  429: 'Hay demasiadas solicitudes. Espera un momento y vuelve a intentar.',
  500: 'El servidor tuvo un fallo interno.',
  502: 'El servidor no está disponible en este momento.',
  503: 'El servidor no está disponible en este momento.',
  504: 'El servidor tardó demasiado en contestar.',
};

const RED = /failed to fetch|networkerror|network error|load failed|fetch failed|err_connection|econnrefused|enotfound|error de conexión/i;

function tecnico(text: string) {
  return /^(failed to fetch|networkerror.*|load failed|fetch failed|internal server error|bad request|unauthorized|forbidden|not found|unprocessable entity|error|http error! status: \d+|error \d+|no se pudo completar la solicitud|error desconocido)$/i.test(text);
}

function codigoHttp(text: string, status?: number) {
  if (status && status >= 100) return status;
  const match = text.match(/status:\s*(\d{3})/i) || text.match(/^error\s+(\d{3})\b/i);
  return match ? Number(match[1]) : undefined;
}

export function explicarTexto(raw: string, status?: number): { motivo: string; codigo: string } {
  const text = raw.trim();
  if (RED.test(text)) {
    return {
      motivo: 'No se pudo conectar con el servidor. Revisa que el sistema esté encendido y que tengas internet.',
      codigo: 'RED',
    };
  }
  if (/abort/i.test(text)) {
    return { motivo: 'La solicitud se canceló antes de terminar.', codigo: 'CANCELADA' };
  }
  if (/tardó demasiado|timeout/i.test(text)) {
    return { motivo: 'La solicitud tardó demasiado. Inténtalo de nuevo.', codigo: 'TIEMPO' };
  }
  if (/token de acceso requerido|no hay token/i.test(text)) {
    return { motivo: 'La sesión no es válida. Vuelve a entrar.', codigo: '401' };
  }
  const http = codigoHttp(text, status);
  if (tecnico(text)) {
    return {
      motivo: (http && FRASES[http]) || 'No se pudo completar la acción.',
      codigo: http ? String(http) : 'AVISO',
    };
  }
  return {
    motivo: text || 'No se pudo completar la acción.',
    codigo: http ? String(http) : 'AVISO',
  };
}

export function vistaDeError(description: string): string {
  const match = description.match(/^(.*)\nCódigo:\s*(\S+)\s*$/s);
  if (match) {
    const previo = match[2];
    const http = /^\d{3}$/.test(previo) ? Number(previo) : undefined;
    const explicado = explicarTexto(match[1].trim(), http);
    const codigo = explicado.codigo === 'AVISO' && previo !== 'AVISO' ? previo : explicado.codigo;
    return `${explicado.motivo}\nCódigo: ${codigo}`;
  }
  const explicado = explicarTexto(description.trim());
  return `${explicado.motivo}\nCódigo: ${explicado.codigo}`;
}

export function falloHttp(response: Response, body: unknown): Error & { status: number } {
  const error = new Error(vistaDeError(`${textoDeError(body)}\nCódigo: ${response.status}`)) as Error & { status: number };
  error.status = response.status;
  return error;
}

export async function mensajeDeError(response: Response): Promise<string> {
  try {
    return vistaDeError(`${textoDeError(await response.json())}\nCódigo: ${response.status}`);
  } catch {
    return vistaDeError(`No se pudo completar la solicitud\nCódigo: ${response.status}`);
  }
}
