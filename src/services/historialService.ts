import { config } from "@/config/environment";
import { falloHttp } from "@/lib/api-error";
import { authService } from "@/services/authService";

export type Cambio = {
  id: number;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: string;
  contexto: string | null;
  creado_en: string;
  usuario: { id: number; nombre: string; correo: string; rol: string | null } | null;
};

export async function listarHistorial(params: { search?: string; accion?: string }) {
  const token = authService.getToken();
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.accion && params.accion !== "all") query.set("accion", params.accion);
  const response = await fetch(`${config.apiBaseUrl}/historial?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw falloHttp(response, body);
  return (body.data || []) as Cambio[];
}
