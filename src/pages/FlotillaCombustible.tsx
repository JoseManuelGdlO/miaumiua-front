import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { config } from "@/config/environment";
import { driversService, type FlotillaFila } from "@/services/driversService";
import type { LecturaEvidencia } from "@/services/callCenterService";

function hoy() {
  const now = new Date();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const dia = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mes}-${dia}`;
}

function hora(iso?: string | null, origen?: LecturaEvidencia["fechaCapturaOrigen"]) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  const texto = fecha.toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit" });
  return origen === "recepcion" ? `${texto} (recepción)` : texto;
}

function fotoSrc(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${config.imageBaseUrl}${url}`;
}

function dinero(valor: number | null | undefined) {
  if (valor == null) return "—";
  return `$${valor.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FlotillaCombustible() {
  const [fecha, setFecha] = useState(hoy);
  const [filas, setFilas] = useState<FlotillaFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setError("");
    driversService.getFlotilla(fecha).then((respuesta) => {
      if (!vivo) return;
      setFilas(respuesta.data || []);
    }).catch((err: unknown) => {
      if (!vivo) return;
      setFilas([]);
      setError(err instanceof Error ? err.message : "No se pudo cargar la flotilla");
    }).finally(() => {
      if (vivo) setLoading(false);
    });
    return () => {
      vivo = false;
    };
  }, [fecha]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flotilla/Combustible</h1>
          <p className="text-muted-foreground">Lecturas del odómetro y del ticket de combustible.</p>
        </div>
        <Input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} className="w-44" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cargas del día</CardTitle>
          <CardDescription>Las alertas quedan para revisión. Una foto ilegible sigue pidiendo que el repartidor la tome otra vez.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : filas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay fotos de odómetro ni combustible en esta fecha.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repartidor</TableHead>
                    <TableHead>Km inicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Captura</TableHead>
                    <TableHead>Recepción</TableHead>
                    <TableHead>Tablero</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Litros</TableHead>
                    <TableHead>Precio/L</TableHead>
                    <TableHead>Hora ticket</TableHead>
                    <TableHead>Estación</TableHead>
                    <TableHead>Folio</TableHead>
                    <TableHead>Alertas</TableHead>
                    <TableHead>Foto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((fila) => {
                    const carga = fila.combustible;
                    const src = fotoSrc(carga?.url);
                    return (
                      <TableRow key={fila.repartidorId}>
                        <TableCell className="font-medium">{fila.nombre || "Sin nombre"}</TableCell>
                        <TableCell>{fila.odometro?.kilometraje ?? "—"}</TableCell>
                        <TableCell>
                          {carga ? (
                            <Badge variant={carga.estado === "validada" ? "default" : carga.estado === "revision" ? "outline" : "destructive"}>
                              {carga.estado === "validada" ? "Validada" : carga.estado === "revision" ? "En revisión" : "Rechazada"}
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell>{hora(carga?.fechaCaptura, carga?.fechaCapturaOrigen)}</TableCell>
                        <TableCell>{hora(carga?.fechaRecepcion)}</TableCell>
                        <TableCell>{carga?.odometro_tablero ?? carga?.kilometraje ?? "—"}</TableCell>
                        <TableCell>{carga?.odometro_ticket ?? "—"}</TableCell>
                        <TableCell>{dinero(carga?.costo_mxn)}</TableCell>
                        <TableCell>{carga?.litros ?? "—"}</TableCell>
                        <TableCell>{dinero(carga?.precio_litro)}</TableCell>
                        <TableCell>{hora(carga?.fecha_hora_ticket)}</TableCell>
                        <TableCell>{carga?.estacion || "—"}</TableCell>
                        <TableCell>{carga?.folio || "—"}</TableCell>
                        <TableCell className="max-w-56 text-sm">
                          {(carga?.alertas || []).length
                            ? carga!.alertas!.map((alerta) => alerta.mensaje).join(" ")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {src ? <a href={src} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">Ver</a> : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
