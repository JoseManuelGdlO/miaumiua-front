import { getCurrentConfig } from "@/config/environment";

type Fila = {
  identificador: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

let filas: Fila[] = [];
let carga: Promise<void> | null = null;

export function flagActiva(identificador: string) {
  return Boolean(filas.find((item) => item.identificador === identificador)?.activo);
}

export function cargarConfiguracion() {
  if (carga) return carga;
  const { apiBaseUrl } = getCurrentConfig();
  carga = (async () => {
    try {
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/configuracion`);
      if (!response.ok) return;
      const body = (await response.json()) as { data?: Fila[] };
      if (Array.isArray(body.data)) filas = body.data;
    } catch {
      // el panel arranca igual; la flag se vuelve a leer al recargar
    }
  })();
  return carga;
}
