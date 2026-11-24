import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  Clock,
  Copy,
  EyeOff,
  Gauge,
  Loader2,
  Receipt,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { config } from "@/config/environment";
import { citiesService, type City } from "@/services/citiesService";
import { driversService, type FlotillaFila } from "@/services/driversService";
import type { LecturaEvidencia } from "@/services/callCenterService";

const RANGO = "$798.00–$802.00";

function hoyMexico() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(new Date());
}

function fechaMexico(delta = 0) {
  const [y, m, d] = hoyMexico().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

function primerDiaMesMexico() {
  return `${hoyMexico().slice(0, 8)}01`;
}

const TONO_ALERTA: Record<string, string> = {
  REUSED_IMAGE: "bg-red-100 text-red-950",
  DUPLICATE_RECEIPT: "bg-red-100 text-red-950",
  FUEL_BELOW_MIN: "bg-red-100 text-red-950",
  ODOMETER_REGRESSION: "bg-orange-100 text-orange-950",
  TICKET_TIME_MISMATCH: "bg-orange-100 text-orange-950",
  AFTER_CUTOFF_TIME: "bg-orange-100 text-orange-950",
  ODOMETER_MISMATCH: "bg-orange-100 text-orange-950",
  FUEL_ABOVE_MAX: "bg-amber-100 text-amber-950",
  MATH_MISMATCH: "bg-yellow-100 text-yellow-950",
  UNREADABLE: "bg-yellow-100 text-yellow-950",
  REPEATED_ODOMETER: "bg-yellow-100 text-yellow-950",
};

const ICONO_ALERTA: Record<string, LucideIcon> = {
  REUSED_IMAGE: Copy,
  DUPLICATE_RECEIPT: Receipt,
  FUEL_BELOW_MIN: ArrowDown,
  FUEL_ABOVE_MAX: ArrowUp,
  TICKET_TIME_MISMATCH: Clock,
  AFTER_CUTOFF_TIME: Clock,
  ODOMETER_MISMATCH: Gauge,
  ODOMETER_REGRESSION: Gauge,
  MATH_MISMATCH: Calculator,
  UNREADABLE: EyeOff,
  REPEATED_ODOMETER: Repeat,
};

const ORDEN_ALERTA = [
  "FUEL_BELOW_MIN",
  "FUEL_ABOVE_MAX",
  "TICKET_TIME_MISMATCH",
  "AFTER_CUTOFF_TIME",
  "REUSED_IMAGE",
  "DUPLICATE_RECEIPT",
  "ODOMETER_MISMATCH",
  "ODOMETER_REGRESSION",
  "UNREADABLE",
  "MATH_MISMATCH",
  "REPEATED_ODOMETER",
];

const ETIQUETA_FILA: Record<string, string> = {
  FUEL_BELOW_MIN: "Inferior al presupuesto",
  FUEL_ABOVE_MAX: "Superior al presupuesto",
  TICKET_TIME_MISMATCH: "Fuera de tiempo",
  AFTER_CUTOFF_TIME: "Después de las 6 p.m.",
  REUSED_IMAGE: "Foto repetida",
  DUPLICATE_RECEIPT: "Ticket repetido",
  ODOMETER_MISMATCH: "Odómetros distintos",
  ODOMETER_REGRESSION: "Odómetro menor",
  UNREADABLE: "Foto ilegible",
  MATH_MISMATCH: "Total no cuadra",
  REPEATED_ODOMETER: "Kilometraje repetido",
};

const TITULO_ALERTA: Record<string, string> = {
  REUSED_IMAGE: "Foto repetida",
  DUPLICATE_RECEIPT: "Ticket repetido",
  FUEL_BELOW_MIN: "Importe menor",
  FUEL_ABOVE_MAX: "Importe mayor",
  TICKET_TIME_MISMATCH: "Hora fuera de rango",
  AFTER_CUTOFF_TIME: "Después de las 6:00 p.m.",
  ODOMETER_MISMATCH: "Odómetros distintos",
  ODOMETER_REGRESSION: "Odómetro menor",
  MATH_MISMATCH: "Total no cuadra",
  UNREADABLE: "Foto ilegible",
  REPEATED_ODOMETER: "Kilometraje repetido",
};

function hora(iso?: string | null) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function fotoSrc(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${config.imageBaseUrl}${url}`;
}

function dinero(valor: number | null | undefined) {
  if (valor == null) return "—";
  return `$${valor.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function resumenFila(carga: LecturaEvidencia | null) {
  if (!carga) return "Sin ticket";
  const codigos = (carga.alertas || []).map((alerta) => alerta.codigo);
  const primero = ORDEN_ALERTA.find((codigo) => codigos.includes(codigo));
  if (!primero) {
    if (carga.estado === "rechazada" || carga.estado === "revision") return "Foto ilegible";
    return "Correcto";
  }
  const extra = codigos.length - 1;
  const etiqueta = ETIQUETA_FILA[primero] || "Revisar carga";
  return extra > 0 ? `${etiqueta} + ${extra}` : etiqueta;
}

function coincideAlerta(carga: LecturaEvidencia | null, filtro: string) {
  if (filtro === "todas") return true;
  const texto = resumenFila(carga);
  if (filtro === "con-alerta") return texto !== "Correcto";
  if (filtro === "correcto") return texto === "Correcto";
  if (filtro === "sin ticket") return !carga;
  const codigos = new Set((carga?.alertas || []).map((alerta) => alerta.codigo));
  if (filtro === "inferior") return codigos.has("FUEL_BELOW_MIN");
  if (filtro === "superior") return codigos.has("FUEL_ABOVE_MAX");
  if (filtro === "tiempo") {
    return codigos.has("TICKET_TIME_MISMATCH") || codigos.has("AFTER_CUTOFF_TIME");
  }
  if (filtro === "odómetro") {
    return codigos.has("ODOMETER_MISMATCH") || codigos.has("ODOMETER_REGRESSION") || codigos.has("REPEATED_ODOMETER");
  }
  if (filtro === "ilegible") {
    return codigos.has("UNREADABLE") || carga?.estado === "rechazada" || carga?.estado === "revision";
  }
  return true;
}

function MiniFoto({
  titulo,
  src,
  alt,
  onAbrir,
}: {
  titulo: string;
  src: string | null;
  alt: string;
  onAbrir: () => void;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs text-muted-foreground">{titulo}</p>
      {src ? (
        <button
          type="button"
          onClick={onAbrir}
          className="block w-full overflow-hidden rounded-xl bg-muted/60"
          aria-label={`Ver más grande: ${titulo}`}
        >
          <img src={src} alt={alt} className="h-40 w-full object-contain" />
        </button>
      ) : (
        <div className="grid h-40 place-items-center rounded-xl bg-muted px-3 text-center text-sm text-muted-foreground">
          Sin foto
        </div>
      )}
    </div>
  );
}

function Dato({
  etiqueta,
  valor,
  captura,
  className = "",
}: {
  etiqueta: string;
  valor: string;
  captura?: string | null;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-muted/60 p-3 ${className}`}>
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{valor}</p>
      {captura ? (
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">Captura {hora(captura)}</p>
      ) : null}
    </div>
  );
}

export default function FlotillaCombustible() {
  const hoy = hoyMexico();
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [filas, setFilas] = useState<FlotillaFila[]>([]);
  const [ciudades, setCiudades] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ciudadId, setCiudadId] = useState("todas");
  const [alerta, setAlerta] = useState("todas");
  const [abierta, setAbierta] = useState<FlotillaFila | null>(null);
  const [fotoGrande, setFotoGrande] = useState<null | "inicio" | "cierre">(null);

  const periodos = [
    { etiqueta: "Solo hoy", desde: hoy, hasta: hoy },
    { etiqueta: "Ayer", desde: fechaMexico(-1), hasta: fechaMexico(-1) },
    { etiqueta: "Últimos 7 días", desde: fechaMexico(-6), hasta: hoy },
    { etiqueta: "Mes actual", desde: primerDiaMesMexico(), hasta: hoy },
  ];

  useEffect(() => {
    let vivo = true;
    citiesService
      .getActiveCities()
      .then((respuesta) => {
        if (vivo) setCiudades(respuesta.data.cities || []);
      })
      .catch(() => {
        if (vivo) setCiudades([]);
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!desde || !hasta) return undefined;
    let vivo = true;
    setLoading(true);
    setError("");
    const [inicio, fin] = desde <= hasta ? [desde, hasta] : [hasta, desde];
    driversService
      .getFlotilla(inicio, fin)
      .then((respuesta) => {
        if (!vivo) return;
        setFilas(respuesta.data || []);
      })
      .catch((err: unknown) => {
        if (!vivo) return;
        setFilas([]);
        setError(
          err instanceof Error ? err.message : "No se pudo cargar la flotilla",
        );
      })
      .finally(() => {
        if (vivo) setLoading(false);
      });
    return () => {
      vivo = false;
    };
  }, [desde, hasta]);

  const visibles = useMemo(
    () =>
      filas.filter((fila) => {
        if (ciudadId !== "todas" && String(fila.ciudadId) !== ciudadId)
          return false;
        return coincideAlerta(fila.combustible, alerta);
      }),
    [filas, ciudadId, alerta],
  );

  const fuera = visibles.filter(
    (fila) => resumenFila(fila.combustible) !== "Correcto",
  ).length;
  const cargaAbierta = abierta?.combustible;
  const fotoInicio = fotoSrc(abierta?.odometro?.url);
  const fotoCierre = fotoSrc(cargaAbierta?.url);
  const fotoModal = fotoGrande === "inicio" ? fotoInicio : fotoGrande === "cierre" ? fotoCierre : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Flotilla/Combustible
          </h1>
          <p className="text-muted-foreground">
            {loading
              ? "Cargando las cargas del día."
              : `${fuera} de ${visibles.length} no salen Correcto. El rango vigente es ${RANGO} y la ventana es de 10 minutos.`}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de combustible</CardTitle>
          <CardDescription>
            Pulsa una fila para ver odómetros, litros, estación, folio y las
            fotos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Periodo</span>
              {periodos.map((periodo) => {
                const activo =
                  periodo.desde === desde && periodo.hasta === hasta;
                return (
                  <Button
                    key={periodo.etiqueta}
                    size="sm"
                    variant={activo ? "default" : "outline"}
                    onClick={() => {
                      setDesde(periodo.desde);
                      setHasta(periodo.hasta);
                    }}
                  >
                    {periodo.etiqueta}
                  </Button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-sm">
                <span className="block">Desde</span>
                <Input
                  type="date"
                  className="w-44"
                  value={desde}
                  onChange={(event) => setDesde(event.target.value)}
                />
              </label>
              <span className="hidden pb-2 text-muted-foreground sm:inline">
                →
              </span>
              <label className="space-y-1 text-sm">
                <span className="block">Hasta</span>
                <Input
                  type="date"
                  className="w-44"
                  value={hasta}
                  onChange={(event) => setHasta(event.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Select value={ciudadId} onValueChange={setCiudadId}>
              <SelectTrigger className="w-56" aria-label="Ciudad">
                <SelectValue placeholder="Todas las ciudades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las ciudades</SelectItem>
                {[...ciudades]
                  .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
                  .map((ciudad) => (
                    <SelectItem key={ciudad.id} value={String(ciudad.id)}>
                      {ciudad.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={alerta} onValueChange={setAlerta}>
              <SelectTrigger className="w-56" aria-label="Alerta">
                <SelectValue placeholder="Todas las alertas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las alertas</SelectItem>
                <SelectItem value="con-alerta">Con alerta</SelectItem>
                <SelectItem value="correcto">Correcto</SelectItem>
                <SelectItem value="inferior">Inferior al rango</SelectItem>
                <SelectItem value="superior">Superior al rango</SelectItem>
                <SelectItem value="tiempo">Tiempo de captura</SelectItem>
                <SelectItem value="odómetro">
                  Sin coincidencia en Odómetro
                </SelectItem>
                <SelectItem value="ilegible">Ticket Ilegible</SelectItem>
                <SelectItem value="sin ticket">Sin Ticket</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando
            </p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : visibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay cargas con esos filtros.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {desde !== hasta ? <TableHead>Fecha</TableHead> : null}
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Repartidor</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead>Ticket → recepción</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibles.map((fila) => {
                    const resultado = resumenFila(fila.combustible);
                    return (
                      <TableRow
                        key={`${fila.repartidorId}-${fila.fecha}`}
                        tabIndex={0}
                        className="cursor-pointer"
                        onClick={() => setAbierta(fila)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ")
                            setAbierta(fila);
                        }}
                      >
                        {desde !== hasta ? (
                          <TableCell className="tabular-nums">
                            {fila.fecha}
                          </TableCell>
                        ) : null}
                        <TableCell>{fila.ciudad || "—"}</TableCell>
                        <TableCell className="font-medium">
                          {fila.nombre || "Sin nombre"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {dinero(fila.combustible?.costo_mxn)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {hora(fila.combustible?.fecha_hora_ticket)} →{" "}
                          {hora(fila.combustible?.fechaRecepcion)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              resultado === "Correcto"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {resultado}
                          </Badge>
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

      <Sheet
        open={abierta != null}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setAbierta(null);
            setFotoGrande(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl"
          onInteractOutside={(event) => {
            if (fotoGrande) event.preventDefault();
          }}
        >
          {abierta ? (
            <>
              <SheetHeader className="space-y-3 border-b px-6 pb-5 pt-6 text-left">
                <div className="pr-8">
                  <Badge
                    variant={
                      resumenFila(cargaAbierta) === "Correcto"
                        ? "outline"
                        : "destructive"
                    }
                  >
                    {resumenFila(cargaAbierta)}
                  </Badge>
                </div>
                <SheetTitle className="text-xl">
                  {abierta.nombre || "Carga"}
                </SheetTitle>
                <SheetDescription>
                  {abierta.fecha} · {abierta.ciudad || "Sin ciudad"} ·{" "}
                  {dinero(cargaAbierta?.costo_mxn)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-6 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <MiniFoto
                    titulo="Inicio de la jornada"
                    src={fotoInicio}
                    alt="Odómetro al inicio"
                    onAbrir={() => setFotoGrande("inicio")}
                  />
                  <MiniFoto
                    titulo="Cierre de la jornada"
                    src={fotoCierre}
                    alt="Ticket y odómetro al cierre"
                    onAbrir={() => setFotoGrande("cierre")}
                  />
                </div>
                {(cargaAbierta?.alertas || []).length ? (
                  <div className="space-y-2">
                    {cargaAbierta!.alertas!.map((item) => {
                      const Icono = ICONO_ALERTA[item.codigo] || EyeOff;
                      return (
                        <div
                          key={item.codigo}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 ${TONO_ALERTA[item.codigo] || "bg-amber-100 text-amber-950"}`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{TITULO_ALERTA[item.codigo] || "Revisar carga"}</p>
                            <p className="mt-1 text-sm">{item.mensaje}</p>
                          </div>
                          <Icono className="ml-auto h-5 w-5 shrink-0" aria-hidden />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm">
                    Ninguna alerta en esta carga.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Dato
                    etiqueta="Km al inicio"
                    valor={
                      abierta.odometro?.kilometraje != null
                        ? `${abierta.odometro.kilometraje.toLocaleString("es-MX")} km`
                        : "—"
                    }
                    captura={abierta.odometro?.fechaCaptura || abierta.odometro?.fechaRecepcion}
                  />
                  <Dato
                    etiqueta="Última hora de captura"
                    valor={hora(cargaAbierta?.fechaCaptura)}
                  />
                  <Dato
                    etiqueta="Última hora de recepción"
                    valor={hora(cargaAbierta?.fechaRecepcion)}
                  />
                  <Dato
                    etiqueta="Hora del ticket"
                    valor={hora(cargaAbierta?.fecha_hora_ticket)}
                  />
                  <Dato
                    etiqueta="Kilometraje en checkout"
                    valor={
                      (cargaAbierta?.odometro_tablero ?? cargaAbierta?.kilometraje) != null
                        ? `${(cargaAbierta?.odometro_tablero ?? cargaAbierta?.kilometraje)!.toLocaleString("es-MX")} km`
                        : "—"
                    }
                    captura={cargaAbierta?.fechaCaptura || cargaAbierta?.fechaRecepcion}
                  />
                  <Dato
                    etiqueta="Litros"
                    valor={
                      cargaAbierta?.litros != null
                        ? String(cargaAbierta.litros)
                        : "—"
                    }
                  />
                  <Dato
                    etiqueta="Precio por litro"
                    valor={dinero(cargaAbierta?.precio_litro)}
                  />
                  <Dato etiqueta="Folio" valor={cargaAbierta?.folio || "—"} />
                  <Dato
                    etiqueta="Estación"
                    valor={cargaAbierta?.estacion || "—"}
                    className="col-span-2"
                  />
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={fotoModal != null} onOpenChange={(abierto) => { if (!abierto) setFotoGrande(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{fotoGrande === "inicio" ? "Inicio de la jornada" : "Cierre de la jornada"}</DialogTitle>
          </DialogHeader>
          {fotoModal ? <img src={fotoModal} alt={fotoGrande === "inicio" ? "Odómetro al inicio" : "Ticket y odómetro al cierre"} className="max-h-[75vh] w-full object-contain" /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
