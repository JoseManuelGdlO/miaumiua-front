import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, ChevronDown, ClipboardCheck, Download, Headphones, History, Inbox, LifeBuoy, Loader2, LogOut, Package, Phone, Receipt, Truck, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { citiesService, type City } from "@/services/citiesService";
import ValidacionCarga from "@/pages/ValidacionCarga";
import IncidenciasPanel from "@/pages/IncidenciasPanel";
import {
  callCenterService,
  type CargaValidada,
  type PedidoDia,
  type RepartidorOpcion,
  type ActividadDisponible,
  type ComprobantePago,
  type DepositoRuta,
  type Solicitud,
  type VelocidadDia,
} from "@/services/callCenterService";
import { canReassign, keepSelection, shouldRefreshAfter, statusLabel, statusOptions } from "@/lib/call-center-rules.mjs";
import { config } from "@/config/environment";
import { FlujoPasos } from "@/components/FlujoPasos";
import { vistaDeError } from "@/lib/api-error";
import { authService } from "@/services/authService";

const TIPO: Record<string, string> = {
  check_in: "Check-in",
  llamada_cliente: "Llamada al cliente",
  soporte: "Soporte",
  cierre_dia: "Cierre de día",
};

function errorStatus(error: unknown) {
  return typeof error === "object" && error && "status" in error ? Number((error as { status: number }).status) : 0;
}

function errorText(error: unknown) {
  return vistaDeError(error instanceof Error ? error.message : "No se pudo completar la solicitud");
}

function formatMoney(value: number) {
  return value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_CLASS: Record<string, string> = {
  pendiente: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary",
  confirmado: "border-transparent bg-sky-100 text-sky-900 hover:bg-sky-100",
  en_preparacion: "border-transparent bg-amber-100 text-amber-900 hover:bg-amber-100",
  en_camino: "border-transparent bg-blue-100 text-blue-900 hover:bg-blue-100",
  entregado: "border-transparent bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  no_entregado: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive",
  cancelado: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive",
};

function receiptSrc(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${config.imageBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function receiptFilename(numero: string, url: string) {
  const clean = numero.replace(/[^\w.-]+/g, "-") || "pedido";
  const match = url.match(/\.([a-z0-9]{2,5})(?:\?|$)/i);
  return `comprobante-${clean}.${match?.[1] || "jpg"}`;
}

function OrderStatus({ estado, modificado }: { estado: string; modificado?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className={STATUS_CLASS[estado] || "hover:bg-background"}>
        {statusLabel(estado)}
      </Badge>
      {modificado ? (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-50">
          Modificado
        </Badge>
      ) : null}
    </div>
  );
}

const LIVE_TIPOS = new Set(["check_in", "llamada_cliente", "soporte", "cierre_dia"]);

const TAB_ALIAS: Record<string, string> = {
  validacion: "checkin",
  operacion: "despacho",
  checkin: "checkin",
  despacho: "despacho",
  soporte: "soporte",
  checkout: "checkout",
  incidencias: "incidencias",
};

function TabAviso({ n, rojo = false, children }: { n: number; rojo?: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      {children}
      {n > 0 ? <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white ${rojo ? "bg-red-600" : "bg-primary"}`}>{n}</span> : null}
    </span>
  );
}

function puedeAutorizarExcepcion() {
  const data = authService.getUserData();
  const rol = data?.rol?.nombre || data?.role || "";
  return rol === "super_admin" || authService.getUserPermissions().includes("*");
}

function iniciales(nombre: string) {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase() || "").join("");
}

const ENTREGA: Record<string, string> = {
  pendiente: "Pendiente",
  en_camino: "En camino",
  entregado: "Entregado",
  fallido: "Fallido",
};

function pideAprobacion(solicitud: Solicitud) {
  return solicitud.ayuda === "codigo" || solicitud.ayuda === "tercero" || solicitud.tipo === "llamada_cliente" || (solicitud.tipo === "soporte" && !solicitud.ayuda);
}

function ActividadExtra({
  driverId,
  ciudadId,
  cities,
  onError,
  onChanged,
}: {
  driverId: number;
  ciudadId: number | null;
  cities: { id: number; nombre: string }[];
  onError: (error: unknown) => void;
  onChanged: () => void;
}) {
  const [ciudad, setCiudad] = useState(ciudadId ? String(ciudadId) : "");
  const [pedido, setPedido] = useState("");
  const [lista, setLista] = useState<ActividadDisponible[]>([]);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!ciudad) return;
    let vivo = true;
    callCenterService.listarActividades(Number(ciudad)).then((rows) => {
      if (vivo) setLista(rows);
    }).catch(onError);
    return () => { vivo = false; };
  }, [ciudad]);

  return (
    <div className="space-y-3 rounded-xl bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold"><Package className="h-5 w-5 text-primary" />Actividad extra</p>
        <p className="text-sm text-muted-foreground">{lista.length} disponibles</p>
      </div>
      <p className="text-sm text-muted-foreground">Asignar pedido a la ruta en curso</p>
      <Select value={ciudad || undefined} onValueChange={(value) => { setCiudad(value); setPedido(""); }}>
        <SelectTrigger aria-label="Ciudad de despacho"><SelectValue placeholder="Ciudad de despacho" /></SelectTrigger>
        <SelectContent>
          {cities.map((city) => <SelectItem key={city.id} value={String(city.id)}>{city.nombre}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={pedido || undefined} onValueChange={setPedido}>
        <SelectTrigger aria-label="Pedido sin ruta"><SelectValue placeholder="Pedido sin ruta" /></SelectTrigger>
        <SelectContent>
          {lista.map((row) => (
            <SelectItem key={row.id} value={String(row.id)}>{row.numero_pedido}{row.cliente ? ` · ${row.cliente}` : ""}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        className="w-full"
        disabled={!pedido || ocupado}
        onClick={() => {
          setOcupado(true);
          void callCenterService.asignarActividad(Number(pedido), driverId)
            .then(() => {
              setPedido("");
              onChanged();
              return callCenterService.listarActividades(Number(ciudad)).then(setLista);
            })
            .catch(onError)
            .finally(() => setOcupado(false));
        }}
      >
        {ocupado ? "Asignando…" : "Asignar a esta ruta"}
      </Button>
    </div>
  );
}

function Cuenta({ desde, minutos }: { desde: string; minutos: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const left = Math.max(0, Math.ceil((Date.parse(desde) + minutos * 60 * 1000 - now) / 1000));
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  return (
    <p className="text-center">
      <span className="block text-sm text-muted-foreground">{left === 0 ? "Tiempo de atención cumplido" : "Tiempo de atención"}</span>
      <span className="text-5xl font-black tabular-nums text-primary">{mm}:{ss}</span>
    </p>
  );
}

const CHIP: Record<string, string> = {
  Llamada: "bg-sky-100 text-sky-900",
  Incidencia: "bg-amber-100 text-amber-900",
  Autorización: "bg-emerald-100 text-emerald-900",
  "No completado": "bg-red-100 text-red-800",
  Reagendado: "bg-primary/10 text-primary",
};

function chipDe(solicitud: Solicitud) {
  if (solicitud.ayuda === "tercero" || solicitud.ayuda === "codigo") return "Autorización";
  if (solicitud.tipo === "llamada_cliente") return "Llamada";
  return "Incidencia";
}

function HistorialHoy({ aprobaciones, fallos }: { aprobaciones: Solicitud[]; fallos: PedidoDia[] }) {
  const [abierto, setAbierto] = useState(false);
  const eventos = [
    ...aprobaciones.map((solicitud) => ({
      id: `s-${solicitud.id}`,
      pedido: solicitud.numero_pedido || "",
      cuando: `${solicitud.fecha || ""} ${solicitud.hora || ""}`.trim(),
      chip: chipDe(solicitud),
      texto: solicitud.motivo || solicitud.numero_pedido || "Aviso",
    })),
    ...fallos.map((pedido) => ({
      id: `p-${pedido.id}`,
      pedido: pedido.numero_pedido || "",
      cuando: "Hoy",
      chip: String(pedido.notas || "").includes("Volvió a la cola") ? "Reagendado" : "No completado",
      texto: `${pedido.numero_pedido} · ${pedido.cliente || "Sin cliente"}`,
    })),
  ];
  let tono = 0;
  let anterior = "";
  const filas = eventos.map((evento) => {
    if (evento.pedido !== anterior) {
      if (anterior) tono = 1 - tono;
      anterior = evento.pedido;
    }
    return { ...evento, claro: tono === 0 };
  });
  const hayMas = filas.length > 2;
  const visibles = abierto ? filas : filas.slice(0, 2);
  if (filas.length === 0) return <p>Sin incidencias hoy.</p>;
  return (
    <div className="space-y-2">
      <div className="relative">
        {visibles.map((evento) => (
          <p key={evento.id} className={`flex flex-wrap items-center gap-2 rounded-md px-2 py-2 ${evento.claro ? "bg-background" : "bg-muted"}`}>
            <span className="text-sm text-muted-foreground">{evento.cuando}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CHIP[evento.chip] || CHIP.Incidencia}`}>{evento.chip}</span>
            <span>{evento.texto}</span>
          </p>
        ))}
        {hayMas && !abierto ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" /> : null}
      </div>
      {hayMas ? (
        <button type="button" className="text-sm font-semibold text-primary" onClick={() => setAbierto((valor) => !valor)}>
          {abierto ? "Ver menos" : `Ver las ${filas.length}`}
        </button>
      ) : null}
    </div>
  );
}

function MonitorRepartidores({
  pedidos,
  solicitudes,
  puede,
  busy,
  codigo,
  codigoDe,
  receptor,
  onReceptor,
  onAyuda,
  onAtender,
  abiertoId,
  velocidades,
  comprobantes,
  depositos,
  cities,
  onError,
  onChanged,
  onReceipt,
}: {
  pedidos: PedidoDia[];
  solicitudes: Solicitud[];
  puede: boolean;
  busy: boolean;
  codigo: string;
  codigoDe: number | null;
  receptor: string;
  onReceptor: (value: string) => void;
  onAyuda: (id: number, accion: "ver_codigo" | "aprobar_codigo" | "autorizar_tercero") => void;
  onAtender: (id: number) => void;
  abiertoId: number | null;
  velocidades: VelocidadDia[];
  comprobantes: ComprobantePago[];
  depositos: DepositoRuta[];
  cities: { id: number; nombre: string }[];
  onError: (error: unknown) => void;
  onChanged: () => void;
  onReceipt: (url: string, numero: string) => void;
}) {
  const [q, setQ] = useState("");
  const [ciudad, setCiudad] = useState("all");
  const [elegido, setElegido] = useState<number | null>(abiertoId);
  const [mensaje, setMensaje] = useState("");
  const [agentes, setAgentes] = useState<{ nombre: string; telefono: string; repartidor_ids: number[]; numeros?: { telefono: string; repartidor_ids: number[] }[] }[]>([]);
  const nombres = new Map<number, string>();
  for (const pedido of pedidos) {
    if (pedido.repartidor) nombres.set(pedido.repartidor.id, pedido.repartidor.nombre_completo);
  }
  for (const solicitud of solicitudes) {
    if (solicitud.repartidor) nombres.set(solicitud.repartidor.id, solicitud.repartidor.nombre_completo);
  }
  useEffect(() => {
    if (abiertoId) setElegido(abiertoId);
  }, [abiertoId]);
  useEffect(() => {
    let vivo = true;
    callCenterService.listContactos().then((data) => {
      if (vivo) setAgentes(data.personas);
    }).catch(onError);
    return () => { vivo = false; };
  }, []);
  const filtro = q.trim().toLowerCase();
  const lista = [...nombres.entries()]
    .filter(([, nombre]) => nombre.toLowerCase().includes(filtro))
    .filter(([id]) => ciudad === "all" || pedidos.some((pedido) => pedido.repartidor?.id === id && String(pedido.ciudad_id) === ciudad))
    .sort((a, b) => a[1].localeCompare(b[1], "es"));

  const activo = lista.find(([id]) => id === elegido) ?? null;
  const resto = activo ? lista.filter(([id]) => id !== activo[0]) : lista;

  const ficha = (id: number, nombre: string) => {
    const paradas = pedidos.filter((pedido) => pedido.repartidor?.id === id);
    const actual = paradas.find((pedido) => pedido.estado_entrega !== "entregado" && pedido.estado !== "entregado" && pedido.estado !== "no_entregado");
    const checkIn = [...solicitudes].reverse().find((solicitud) => solicitud.tipo === "check_in" && solicitud.repartidor?.id === id);
    const aprobaciones = solicitudes.filter((solicitud) => solicitud.repartidor?.id === id && (pideAprobacion(solicitud) || solicitud.tipo === "soporte"));
    const velocidad = velocidades.find((row) => row.repartidor_id === id);
    const numeros = new Set(paradas.map((pedido) => pedido.numero_pedido));
    const fotos = comprobantes.filter((row) => numeros.has(row.numero_pedido) || row.repartidor === nombre);
    const cierres = depositos.filter((row) => row.repartidor === nombre && row.comprobante_url);
    const agente = agentes.flatMap((persona) => {
      const lineas = persona.numeros?.length ? persona.numeros : [{ telefono: persona.telefono, repartidor_ids: persona.repartidor_ids }];
      return lineas.filter((linea) => linea.repartidor_ids.includes(id) && linea.telefono).map((linea) => ({ nombre: persona.nombre, telefono: linea.telefono }));
    })[0] || null;
    const telefonoRepartidor = paradas.find((pedido) => pedido.repartidor?.telefono)?.repartidor?.telefono || null;
    const fallos = paradas.filter((pedido) => pedido.estado === "no_entregado" || pedido.estado_entrega === "fallido");
    const enRuta = paradas.some((pedido) => pedido.estado_entrega !== "entregado" && pedido.estado !== "entregado");
    const pideAtencion = solicitudes.some((solicitud) => solicitud.tipo === "soporte" && solicitud.repartidor?.id === id);
    const ciudadNombre = cities.find((city) => city.id === paradas.find((pedido) => pedido.ciudad_id)?.ciudad_id)?.nombre;
    return { paradas, actual, checkIn, aprobaciones, velocidad, fotos, cierres, agente, telefonoRepartidor, fallos, enRuta, pideAtencion, ciudadNombre };
  };

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Truck className="h-5 w-5 text-primary" />Repartidores de hoy</h2>
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Filtrar por nombre"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Filtrar por nombre"
          className="h-10 w-56 rounded-md border bg-background px-3 text-sm"
        />
        <Select value={ciudad} onValueChange={setCiudad}>
          <SelectTrigger className="w-56" aria-label="Filtrar por ciudad"><SelectValue placeholder="Filtrar por Ciudad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ciudades</SelectItem>
            {cities.map((city) => <SelectItem key={city.id} value={String(city.id)}>{city.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {activo ? (() => {
        const [id, nombre] = activo;
        const row = ficha(id, nombre);
        return (
          <div data-aviso={row.pideAtencion ? "1" : undefined} className={`overflow-hidden rounded-xl border-t-4 bg-white ${row.pideAtencion ? "aviso-borde border-primary" : "border-primary"}`}>
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{iniciales(nombre)}</span>
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                    {nombre}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.enRuta ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{row.enRuta ? "En ruta" : "Sin entregas"}</span>
                    {row.pideAtencion ? <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Tiene una incidencia" /> : null}
                  </p>
                  <p className="text-sm text-muted-foreground">ID {id}{row.ciudadNombre ? ` · ${row.ciudadNombre}` : ""}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setElegido(null)}>Cerrar</Button>
            </div>
            <div className="grid gap-4 bg-muted/40 p-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-4">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground"><ClipboardCheck className="h-4 w-4 text-primary" />Último check-in</p>
                    <p className="mt-2 text-lg font-semibold">{row.checkIn ? `${row.checkIn.fecha}` : "Sin check-in"}</p>
                    {row.checkIn ? <p className="text-lg font-semibold">{row.checkIn.hora}</p> : null}
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="h-4 w-4 text-primary" />Velocidad promedio</p>
                    <p className="mt-2 text-lg font-semibold">{row.velocidad ? `${row.velocidad.promedio} km/h` : "Sin lecturas"}</p>
                    {row.velocidad ? <p className="text-sm text-muted-foreground">{row.velocidad.lecturas} lecturas de hoy</p> : null}
                  </div>
                </div>
                <div className="space-y-3 rounded-xl bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-semibold"><Package className="h-5 w-5 text-primary" />Pedido en curso</p>
                    {row.actual ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{ENTREGA[row.actual.estado_entrega] || row.actual.estado}</span> : null}
                  </div>
                  {row.actual ? (
                    <>
                      <p className="text-lg font-semibold">{row.actual.numero_pedido}</p>
                      <p>{row.actual.cliente || "Sin cliente"}</p>
                      {row.actual.telefono ? <a className="inline-flex items-center gap-2 text-primary" href={`tel:${row.actual.telefono}`}><Phone className="h-4 w-4" />{row.actual.telefono}</a> : <p>Sin teléfono</p>}
                      <p>{row.actual.direccion || "Sin dirección"}{row.actual.horario_preferente ? ` · a partir de ${row.actual.horario_preferente}` : ""}</p>
                      {row.actual.metodo_pago ? <p>Método de pago: {row.actual.metodo_pago}</p> : null}
                      {row.actual.total > 0 ? <p>Monto a cobrar en entrega: ${formatMoney(row.actual.total)} MXN</p> : null}
                    </>
                  ) : <p>Sin pedido pendiente. No tiene entregas activas ahora.</p>}
                  {row.paradas.length > 0 ? (
                    <div className="space-y-2">
                      <p className="font-semibold">Ruta de hoy</p>
                      {row.paradas.map((pedido) => {
                        const esActual = row.actual?.id === pedido.id;
                        const entregado = pedido.estado_entrega === "entregado" || pedido.estado === "entregado";
                        return (
                        <p key={pedido.id} className={entregado ? "opacity-60" : esActual ? "font-semibold" : "text-muted-foreground"}>
                          {pedido.numero_pedido} · {pedido.cliente || "Sin cliente"} · <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${entregado ? "bg-emerald-100 text-emerald-800" : "bg-pink-100 text-pink-900"}`}>{entregado ? "Entregado" : esActual ? "En curso" : "Pendiente"}</span>
                        </p>
                        );
                      })}
                    </div>
                  ) : null}
                  {row.aprobaciones.map((solicitud) => (
                    <div key={solicitud.id} className="space-y-2 rounded-xl bg-pink-50 p-3">
                      <p className="font-semibold">
                        {solicitud.ayuda === "tercero" ? "Entrega a otra persona" : solicitud.ayuda === "codigo" ? "Ayuda con el código" : solicitud.tipo === "llamada_cliente" ? "Llamada al cliente" : "Incidencia"}
                        {solicitud.numero_pedido ? ` · ${solicitud.numero_pedido}` : ""}
                      </p>
                      {solicitud.motivo ? <p>{solicitud.motivo}</p> : null}
                      {solicitud.espera_desde ? <Cuenta desde={solicitud.espera_desde} minutos={solicitud.ayuda ? 15 : 5} /> : null}
                      {solicitud.ayuda === "codigo" ? (
                        codigoDe === solicitud.id && codigo ? <p className="text-2xl font-semibold tracking-widest">{codigo}</p> : (
                          <Button variant="outline" disabled={busy} onClick={() => onAyuda(solicitud.id, "ver_codigo")}>Ver código</Button>
                        )
                      ) : null}
                      {solicitud.ayuda === "codigo" && puede ? (
                        <Button disabled={busy} onClick={() => onAyuda(solicitud.id, "aprobar_codigo")}>Aprobar entrega sin código</Button>
                      ) : null}
                      {solicitud.ayuda === "codigo" && !puede ? <p>Solo un super admin puede aprobar la entrega sin código.</p> : null}
                      {solicitud.ayuda === "tercero" && puede ? (
                        <>
                          <label className="block" htmlFor={`quien-${solicitud.id}`}>Quién recibe</label>
                          <input
                            id={`quien-${solicitud.id}`}
                            value={receptor}
                            onChange={(event) => onReceptor(event.target.value)}
                            className="h-10 w-full rounded-md border bg-background px-3"
                          />
                          <Button disabled={busy || receptor.trim().length < 2} onClick={() => onAyuda(solicitud.id, "autorizar_tercero")}>Autorizar terceros</Button>
                        </>
                      ) : null}
                      {solicitud.ayuda === "tercero" && !puede ? <p>Solo un super admin puede autorizar la entrega a otra persona.</p> : null}
                      {!solicitud.ayuda ? (
                        <Button disabled={busy} onClick={() => onAtender(solicitud.id)}>Atendido</Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-3 rounded-xl bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 font-semibold"><Receipt className="h-5 w-5 text-primary" />Comprobantes de hoy</p>
                    <p className="text-sm text-muted-foreground">{row.fotos.length + row.cierres.length} recibos</p>
                  </div>
                  {row.fotos.length === 0 && row.cierres.length === 0 ? <p>No hay comprobantes de hoy.</p> : null}
                  {row.fotos.map((foto) => (
                    <div key={foto.pedido_id} className="flex items-center justify-between gap-3">
                      <p>{foto.numero_pedido} · {foto.metodo}</p>
                      {foto.comprobante_url ? (
                        <button type="button" onClick={() => onReceipt(receiptSrc(foto.comprobante_url), foto.numero_pedido)} aria-label={`Ver comprobante ${foto.numero_pedido}`}>
                          <img src={receiptSrc(foto.comprobante_url)} alt="" className="h-12 w-12 rounded-md object-cover" />
                        </button>
                      ) : <p className="text-sm text-muted-foreground">Sin foto</p>}
                    </div>
                  ))}
                  {row.cierres.map((cierre) => (
                    <button key={cierre.jornada_id} type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => cierre.comprobante_url && onReceipt(receiptSrc(cierre.comprobante_url), nombre)}>
                      <span>Depósito ${formatMoney(cierre.efectivo_a_depositar)}</span>
                      <img src={receiptSrc(cierre.comprobante_url)} alt={`Depósito de ${nombre}`} className="h-12 w-12 rounded-md object-cover" />
                    </button>
                  ))}
                </div>
                <div className="space-y-3 rounded-xl bg-white p-4">
                  <p className="flex items-center gap-2 font-semibold"><Phone className="h-5 w-5 text-primary" />Teléfonos</p>
                  <p>Repartidor</p>
                  {row.telefonoRepartidor ? (
                    <button type="button" className="text-left text-lg font-semibold" onClick={() => void navigator.clipboard.writeText(row.telefonoRepartidor || "")}>{row.telefonoRepartidor}</button>
                  ) : <p>Sin teléfono del repartidor</p>}
                  <p>Soporte asignado{row.agente ? ` · ${row.agente.nombre}` : ""}</p>
                  {row.agente ? (
                    <button type="button" className="text-left text-lg font-semibold text-primary" onClick={() => void navigator.clipboard.writeText(row.agente?.telefono || "")}>{row.agente.telefono}</button>
                  ) : <p>Sin agente. La app usa el teléfono de la ciudad.</p>}
                  <p className="text-sm text-muted-foreground">Toca un número para copiarlo.</p>
                </div>
                <div className="space-y-2 rounded-xl bg-white p-4">
                  <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5 text-primary" />Incidencias del repartidor</p>
                  <HistorialHoy aprobaciones={row.aprobaciones} fallos={row.fallos} />
                </div>
                <div className="space-y-2 rounded-xl bg-white p-4">
                  <label className="block font-semibold" htmlFor={`respuesta-${id}`}>Escribir al repartidor</label>
                  <Textarea id={`respuesta-${id}`} value={mensaje} onChange={(event) => setMensaje(event.target.value)} placeholder="NIP, autorización o una indicación" />
                  <Button disabled={busy || mensaje.trim().length < 2} onClick={() => {
                    const texto = mensaje.trim();
                    void callCenterService.responder(id, texto).then(() => setMensaje("")).catch(onError);
                  }}>Enviar</Button>
                  <p className="text-sm text-muted-foreground">Llega si la app del repartidor está abierta.</p>
                </div>
                <ActividadExtra
                  driverId={id}
                  ciudadId={row.paradas.find((pedido) => pedido.ciudad_id)?.ciudad_id ?? null}
                  cities={cities}
                  onError={onError}
                  onChanged={onChanged}
                />
              </div>
            </div>
          </div>
        );
      })() : null}
      {resto.length === 0 && !activo ? <p>Nadie en ruta hoy.</p> : resto.length > 0 ? (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-primary" />{activo ? "Otros repartidores" : "En turno hoy"}</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {resto.map(([id, nombre]) => {
              const row = ficha(id, nombre);
              return (
                <button
                  key={id}
                  type="button"
                  data-aviso={row.pideAtencion ? "1" : undefined}
                  onClick={() => setElegido(id)}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left ${row.pideAtencion ? "aviso-borde bg-white" : "bg-muted/40"}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{iniciales(nombre)}</span>
                    <span>
                      <span className="block font-semibold">{nombre}</span>
                      <span className="block text-sm text-muted-foreground">{row.paradas.length} pedidos en ruta</span>
                    </span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.enRuta ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>{row.enRuta ? "En ruta" : "Libre"}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckoutDia({
  pedidos,
  solicitudes,
  cities,
  busy,
  puede,
  onCerrar,
  onAprobar,
}: {
  pedidos: PedidoDia[];
  solicitudes: Solicitud[];
  cities: { id: number; nombre: string }[];
  busy: boolean;
  puede: boolean;
  onCerrar: (id: number) => void;
  onAprobar: (id: number) => void;
}) {
  const [q, setQ] = useState("");
  const [ciudad, setCiudad] = useState("all");
  const [elegido, setElegido] = useState<number | null>(null);
  const [confirmar, setConfirmar] = useState<number | null>(null);
  const [extra, setExtra] = useState<{ id: number; nombre_completo: string }[]>([]);
  useEffect(() => {
    if (ciudad === "all") {
      setExtra([]);
      return;
    }
    let vivo = true;
    callCenterService.listRepartidores(Number(ciudad)).then((rows) => {
      if (vivo) setExtra(rows);
    }).catch(() => {});
    return () => { vivo = false; };
  }, [ciudad]);
  const nombres = new Map<number, string>();
  for (const driver of extra) nombres.set(driver.id, driver.nombre_completo);
  for (const pedido of pedidos) {
    if (pedido.repartidor) nombres.set(pedido.repartidor.id, pedido.repartidor.nombre_completo);
  }
  for (const solicitud of solicitudes) {
    if (solicitud.repartidor) nombres.set(solicitud.repartidor.id, solicitud.repartidor.nombre_completo);
  }
  const filtro = q.trim().toLowerCase();
  const lista = [...nombres.entries()]
    .filter(([, nombre]) => nombre.toLowerCase().includes(filtro))
    .filter(([id]) => ciudad === "all" || extra.some((driver) => driver.id === id) || pedidos.some((pedido) => pedido.repartidor?.id === id && String(pedido.ciudad_id) === ciudad))
    .sort((a, b) => a[1].localeCompare(b[1], "es"));
  const activo = lista.find(([id]) => id === elegido) ?? null;
  const resto = activo ? lista.filter(([id]) => id !== activo[0]) : lista;
  const cierresDe = (id: number) => solicitudes.filter((row) => row.tipo === "cierre_dia" && row.repartidor?.id === id);

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><LogOut className="h-5 w-5 text-primary" />Check-out</h2>
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Filtrar por nombre"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Filtrar por nombre"
          className="h-10 w-56 rounded-md border bg-background px-3 text-sm"
        />
        <Select value={ciudad} onValueChange={setCiudad}>
          <SelectTrigger className="w-56" aria-label="Filtrar por ciudad"><SelectValue placeholder="Filtrar por Ciudad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ciudades</SelectItem>
            {cities.map((city) => <SelectItem key={city.id} value={String(city.id)}>{city.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {activo ? (() => {
        const [id, nombre] = activo;
        const cierres = cierresDe(id);
        return (
          <div className="space-y-4 overflow-hidden rounded-xl border-t-4 border-primary bg-white">
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{iniciales(nombre)}</span>
                <p className="text-lg font-semibold">{nombre}</p>
              </div>
              <Button variant="outline" onClick={() => setElegido(null)}>Cerrar</Button>
            </div>
            <div className="space-y-3 bg-muted/40 p-4">
              {cierres.length === 0 ? <p>Este repartidor no ha enviado el cierre de hoy.</p> : cierres.map((row) => (
                <div key={row.id} data-aviso="1" className="aviso-rojo space-y-3 rounded-xl bg-white p-4">
                  <p><span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Check-out pendiente</span></p>
                  <p className="font-semibold">Efectivo a depositar ${formatMoney(row.efectivo_a_depositar || 0)}</p>
                  {row.comprobante_url ? (
                    <img src={receiptSrc(row.comprobante_url)} alt={`Comprobante de ${nombre}`} className="max-h-64 w-full rounded-md object-contain" />
                  ) : <p>Este cierre no trae comprobante.</p>}
                  {puede ? (
                    <Button size="lg" className="h-12 px-8" disabled={busy || !row.comprobante_url} onClick={() => onAprobar(row.id)}>
                      {busy ? "Aprobando…" : "Aprobar Check-out"}
                    </Button>
                  ) : <p>Solo un super admin puede aprobar el check-out.</p>}
                </div>
              ))}
              {puede ? (
                <Button disabled={busy} onClick={() => setConfirmar(id)}>Cerrar jornada</Button>
              ) : <p>Solo un super admin puede cerrar la jornada sin el cierre del repartidor.</p>}
            </div>
          </div>
        );
      })() : null}
      {resto.length === 0 && !activo ? <p>Nadie en ruta hoy.</p> : resto.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {resto.map(([id, nombre]) => {
            const pendiente = cierresDe(id).length > 0;
            return (
              <button
                key={id}
                type="button"
                data-aviso={pendiente ? "1" : undefined}
                onClick={() => setElegido(id)}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left ${pendiente ? "aviso-rojo bg-white" : "bg-muted/40"}`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{iniciales(nombre)}</span>
                  <span className="block font-semibold">{nombre}</span>
                </span>
                {pendiente ? <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Cierre por aprobar" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
      <AlertDialog open={confirmar != null} onOpenChange={(open) => { if (!open) setConfirmar(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que deseas cerrar la jornada de este repartidor?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const id = confirmar;
              setConfirmar(null);
              if (id != null) onCerrar(id);
            }}>Cerrar jornada</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MapaTab({ titulo, texto, icono: Icono }: { titulo: string; texto: string; icono: typeof Package }) {
  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Icono className="h-5 w-5 text-primary" />
        {titulo}
      </h2>
      <p className="mt-1 text-muted-foreground">{texto}</p>
    </div>
  );
}

const CallCenter = () => {
  const { toast } = useToast();
  const stream = useNotificationStream();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TAB_ALIAS[tabParam || ""] || "soporte";
  const cargaPanel = useRef<HTMLDivElement>(null);
  const solicitudParam = Number(searchParams.get("solicitud"));
  const cargaId = Number.isFinite(solicitudParam) && solicitudParam > 0 ? solicitudParam : null;
  const avisoParam = Number(searchParams.get("aviso"));
  const avisoId = Number.isFinite(avisoParam) && avisoParam > 0 ? avisoParam : null;
  const avisosCola = stream?.avisos ?? [];
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [pedidos, setPedidos] = useState<PedidoDia[]>([]);
  const [velocidades, setVelocidades] = useState<VelocidadDia[]>([]);
  const [comprobantes, setComprobantes] = useState<ComprobantePago[]>([]);
  const [comprobantesHistorico, setComprobantesHistorico] = useState<ComprobantePago[] | null>(null);
  const [filtroPago, setFiltroPago] = useState("all");
  const [filtroCobro, setFiltroCobro] = useState("");
  const [notaCobro, setNotaCobro] = useState<Record<number, string>>({});
  const [depositos, setDepositos] = useState<DepositoRuta[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [ciudadId, setCiudadId] = useState<string>("all");
  const [repartidorId, setRepartidorId] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Solicitud | null>(null);
  const [codigoAyuda, setCodigoAyuda] = useState("");
  const [codigoDe, setCodigoDe] = useState<number | null>(null);
  const [receptor, setReceptor] = useState("");
  const [nota, setNota] = useState("");
  const [busy, setBusy] = useState(false);
  const [trabajando, setTrabajando] = useState("");
  const [reassignFor, setReassignFor] = useState<PedidoDia | null>(null);
  const [drivers, setDrivers] = useState<RepartidorOpcion[]>([]);
  const [targetDriver, setTargetDriver] = useState<string>("");
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  const [motivoCierre, setMotivoCierre] = useState("");
  const [estadoBusyIds, setEstadoBusyIds] = useState<number[]>([]);
  const [historial, setHistorial] = useState<CargaValidada[]>([]);
  const [historialId, setHistorialId] = useState<number | null>(null);
  const [historialTick, setHistorialTick] = useState(0);
  const [receipt, setReceipt] = useState<{ url: string; numero: string } | null>(null);
  const [flujoAbierto, setFlujoAbierto] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const listGeneration = useRef(0);
  const latestFilters = useRef({ ciudadId, repartidorId });
  const detailRequest = useRef(0);
  const reassignRequest = useRef(0);
  const reassignPedidoId = useRef<number | null>(null);
  const estadoPending = useRef(new Set<number>());
  latestFilters.current = { ciudadId, repartidorId };

  const notify = (error: unknown) => {
    toast({ title: "Call Center", description: errorText(error), variant: "destructive" });
  };

  const cambiarFranja = async (id: number, franja: "manana" | "tarde", alcance?: "ruta") => {
    try {
      await callCenterService.cambiarFranja(id, franja, alcance);
      await loadLists();
    } catch (error) {
      notify(error);
    }
  };

  const moverParada = async (id: number, direccion: "subir" | "bajar") => {
    try {
      await callCenterService.moverParada(id, direccion);
      await loadLists();
    } catch (error) {
      notify(error);
    }
  };

  const liberarSiguiente = async (id: number) => {
    if (trabajando) return;
    setTrabajando(`liberar:${id}`);
    try {
      await callCenterService.liberarSiguiente(id);
      toast({ title: "Siguiente pedido liberado", description: "El repartidor ya puede ver esa parada en la app." });
      await loadLists();
    } catch (error) {
      notify(error);
    } finally {
      setTrabajando("");
    }
  };

  const loadLists = useCallback(async () => {
    const requestedCiudad = ciudadId;
    const requestedRepartidor = repartidorId;
    const filtersStillMatch = () =>
      latestFilters.current.ciudadId === requestedCiudad && latestFilters.current.repartidorId === requestedRepartidor;
    if (!filtersStillMatch()) return;
    const generation = ++listGeneration.current;
    const filters = {
      ciudadId: ciudadId === "all" ? undefined : Number(ciudadId),
      repartidorId: repartidorId === "all" ? undefined : Number(repartidorId),
    };
    const stillCurrent = () => generation === listGeneration.current && filtersStillMatch();
    try {
      const [nextSolicitudes, nextPedidos, nextVelocidad, nextComprobantes, nextDepositos] = await Promise.all([
        callCenterService.listSolicitudes(),
        callCenterService.listPedidos(filters),
        callCenterService.listarVelocidad().catch(() => [] as VelocidadDia[]),
        callCenterService.listarComprobantes().catch(() => [] as ComprobantePago[]),
        callCenterService.listarDepositos().catch(() => [] as DepositoRuta[]),
      ]);
      if (!stillCurrent()) return;
      setSolicitudes(nextSolicitudes);
      setPedidos(nextPedidos);
      setVelocidades(nextVelocidad);
      setComprobantes(nextComprobantes);
      setDepositos(nextDepositos);
      setSelectedId((current) => keepSelection(current));
    } catch (error) {
      if (!stillCurrent()) return;
      throw error;
    }
  }, [ciudadId, repartidorId]);

  const openValidacion = (id: number) => {
    setSearchParams({ tab: "checkin", solicitud: String(id) });
  };

  useEffect(() => {
    if (!cargaId || tab !== "checkin") return;
    cargaPanel.current?.scrollIntoView({ block: "nearest" });
  }, [cargaId, tab]);

  const closeValidacion = () => {
    setSearchParams({ tab: "checkin" });
  };

  const onTab = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    void citiesService.getActiveCities().then((response) => setCities(response.data.cities)).catch(notify);
  }, []);

  useEffect(() => {
    if (tab !== "checkin") return;
    let stop = false;
    void callCenterService.listCargasValidadas().then((rows) => {
      if (!stop) setHistorial(rows);
    }).catch((error) => {
      if (!stop) toast({ title: "Call Center", description: errorText(error), variant: "destructive" });
    });
    return () => {
      stop = true;
    };
  }, [tab, historialTick, toast]);

  useEffect(() => {
    let stop = false;
    let inFlight = false;
    let failureNotified = false;
    const run = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        await loadLists();
        failureNotified = false;
      } catch (error) {
        if (!stop && !failureNotified) {
          failureNotified = true;
          notify(error);
        }
      } finally {
        inFlight = false;
      }
    };
    void run();
    const timer = setInterval(run, 5000);
    const unsubscribe = stream?.subscribe((event) => {
      if (event.type === "reconnect") {
        void run();
        return;
      }
      const tipo = event.payload?.datos?.tipo;
      if (typeof tipo === "string" && LIVE_TIPOS.has(tipo)) void run();
    });
    return () => {
      stop = true;
      listGeneration.current += 1;
      clearInterval(timer);
      unsubscribe?.();
    };
  }, [loadLists, stream]);

  const dismissDetail = () => {
    detailRequest.current += 1;
    setDetail(null);
    setCodigoAyuda("");
    setCodigoDe(null);
    setReceptor("");
    setSelectedId(null);
  };

  const openSolicitud = async (id: number) => {
    const requestId = ++detailRequest.current;
    try {
      const next = await callCenterService.getSolicitud(id);
      if (requestId !== detailRequest.current) return;
      setSelectedId(id);
      setDetail(next);
      setNota("");
    } catch (error) {
      if (requestId !== detailRequest.current) return;
      notify(error);
    }
  };

  const openedAviso = useRef<number | null>(null);
  useEffect(() => {
    if (!avisoId || (tab !== "despacho" && tab !== "soporte") || openedAviso.current === avisoId) return;
    openedAviso.current = avisoId;
    stream?.dismissAviso(String(avisoId));
    if (tab === "despacho") void openSolicitud(avisoId);
  }, [avisoId, tab, stream]);

  const marcas = tab === "checkin"
    ? solicitudes.filter((row) => row.tipo === "check_in").length
    : tab === "despacho"
      ? solicitudes.filter((row) => row.tipo === "llamada_cliente").length
      : tab === "soporte"
        ? solicitudes.filter((row) => row.tipo === "soporte").length
        : tab === "checkout"
          ? solicitudes.filter((row) => row.tipo === "cierre_dia").length
          : pedidos.filter((row) => row.estado === "no_entregado" || row.estado_entrega === "fallido").length;
  useEffect(() => {
    if (!marcas) return;
    document.querySelector("[data-aviso='1']")?.scrollIntoView({ block: "nearest" });
  }, [tab, marcas]);

  const afterAction = async (error?: unknown) => {
    if (error) {
      notify(error);
      if (shouldRefreshAfter(errorStatus(error))) {
        try { await loadLists(); } catch (refreshError) { notify(refreshError); }
      }
      return;
    }
    try { await loadLists(); } catch (refreshError) { notify(refreshError); }
  };

  const aprobarCierre = async (id: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await callCenterService.liberarCierre(id);
      toast({ title: "Día completado", description: result.cerrado_por_nombre || undefined });
      if (detail?.id === id) dismissDetail();
      await afterAction();
    } catch (error) {
      await afterAction(error);
    } finally {
      setBusy(false);
    }
  };

  const cerrarDirecto = async (id: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await callCenterService.cierreDirecto(id);
      toast({ title: "Jornada cerrada", description: result.cerrado_por_nombre || undefined });
      await afterAction();
    } catch (error) {
      await afterAction(error);
    } finally {
      setBusy(false);
    }
  };

  const atender = async (id = detail?.id) => {
    if (!id || busy) return;
    setBusy(true);
    try {
      await callCenterService.atender(id, nota.trim() || undefined);
      toast({ title: "Solicitud atendida" });
      dismissDetail();
      await afterAction();
    } catch (error) {
      await afterAction(error);
    } finally {
      setBusy(false);
    }
  };

  const closeReassign = () => {
    reassignRequest.current += 1;
    reassignPedidoId.current = null;
    setReassignFor(null);
    setNuevoEstado("");
    setMotivoCierre("");
  };

  const openCambios = async (pedido: PedidoDia) => {
    const requestId = ++reassignRequest.current;
    reassignPedidoId.current = pedido.id;
    setReassignFor(pedido);
    setDrivers([]);
    setTargetDriver("");
    setNuevoEstado("");
    setMotivoCierre("");
    if (!pedido.ciudad_id || !canReassign(pedido.estado)) return;
    try {
      const next = await callCenterService.listRepartidores(pedido.ciudad_id);
      if (requestId !== reassignRequest.current || reassignPedidoId.current !== pedido.id) return;
      setDrivers(next);
    } catch (error) {
      if (requestId !== reassignRequest.current || reassignPedidoId.current !== pedido.id) return;
      setDrivers([]);
      notify(error);
    }
  };

  const aplicarEstado = async () => {
    if (!reassignFor || !nuevoEstado || estadoPending.current.has(reassignFor.id)) return;
    const pedido = reassignFor;
    const estado = nuevoEstado;
    estadoPending.current.add(pedido.id);
    setEstadoBusyIds([...estadoPending.current]);
    try {
      await callCenterService.cambiarEstado(pedido.id, estado);
      toast({ title: "Estado actualizado" });
      closeReassign();
      await loadLists();
    } catch (error) {
      await afterAction(error);
    } finally {
      estadoPending.current.delete(pedido.id);
      setEstadoBusyIds([...estadoPending.current]);
    }
  };

  const resolverAyuda = async (id: number, accion: "ver_codigo" | "aprobar_codigo" | "autorizar_tercero") => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await callCenterService.resolverAyuda(id, accion, accion === "autorizar_tercero" ? receptor : undefined);
      if (accion === "ver_codigo") {
        setCodigoAyuda(result.codigo || "");
        setCodigoDe(id);
      } else {
        toast({ title: accion === "aprobar_codigo" ? "Entrega aprobada sin código" : "Entrega a otra persona autorizada" });
        setReceptor("");
        if (detail?.id === id) dismissDetail();
        await loadLists();
      }
    } catch (error) {
      notify(error);
    } finally {
      setBusy(false);
    }
  };

  const aCola = async (id: number) => {
    const manana = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const fecha = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(manana);
    try {
      await callCenterService.reagendar(id, fecha, "A la cola de planeación");
      toast({ title: "Pedido en la cola de planeación" });
      await loadLists();
    } catch (error) {
      notify(error);
    }
  };

  const cerrarSinCodigo = async () => {
    if (!reassignFor || busy || motivoCierre.trim().length < 5) return;
    setBusy(true);
    try {
      await callCenterService.cerrarSinCodigo(reassignFor.id, motivoCierre.trim());
      toast({ title: "Pedido cerrado sin código", description: "Quedó como no entregado y el motivo se guardó en el historial." });
      closeReassign();
      await loadLists();
    } catch (error) {
      notify(error);
    } finally {
      setBusy(false);
    }
  };

  const confirmReassign = async () => {
    if (!reassignFor || !targetDriver || busy) return;
    setBusy(true);
    try {
      await callCenterService.reasignar(reassignFor.id, Number(targetDriver));
      toast({ title: "Pedido reasignado" });
      closeReassign();
      await loadLists();
    } catch (error) {
      await afterAction(error);
    } finally {
      setBusy(false);
    }
  };

  const downloadReceipt = async () => {
    if (!receipt || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(receipt.url);
      if (!response.ok) throw new Error("No se pudo descargar el comprobante");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = receiptFilename(receipt.numero, receipt.url);
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      notify(error);
    } finally {
      setDownloading(false);
    }
  };

  const driverOptions = Array.from(
    new Map(pedidos.filter((row) => row.repartidor).map((row) => [row.repartidor!.id, row.repartidor!])).values()
  );

  const pendientes = solicitudes.filter((row) => row.tipo === "check_in");
  return (
    <div className="min-h-full bg-slate-50">
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Headphones className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Center</h1>
          <p className="text-muted-foreground">
            Gestión de solicitudes, despacho y validación en tiempo real
          </p>
        </div>
      </div>
      <Collapsible open={flujoAbierto} onOpenChange={setFlujoAbierto} className="rounded-lg bg-primary/10">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-primary">
          <span className="inline-flex items-center gap-2"><Headphones className="h-4 w-4" />Cómo funciona Call Center</span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${flujoAbierto ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <FlujoPasos
            columnas={2}
            className="px-4 pb-4"
            numeroClassName="bg-background text-primary"
            textoClassName="text-foreground/80"
            pasos={[
              { titulo: "Cola", texto: "El repartidor llega al pedir la validación, una llamada, soporte o el cierre. El aviso del menú abre la pestaña que toca." },
              { titulo: "Validación de carga", texto: "En Por validar pulsa Aprobar y después Aprobar carga. Con eso el repartidor puede iniciar la ruta." },
              { titulo: "Soporte en ruta", texto: "El perfil muestra el teléfono del repartidor y el de soporte, para copiar. Solo un super admin autoriza sin código, a terceros o cambia contactos." },
              { titulo: "Cierre e incidencias", texto: "Solo un super admin aprueba el check-out o cierra la jornada directo. Si nadie recibió el pedido, pasa al día siguiente y el cliente recibe WhatsApp para reprogramar." },
            ]}
          />
        </CollapsibleContent>
      </Collapsible>
      <Tabs value={tab} onValueChange={onTab}>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <TabsList className="flex h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="despacho" className="rounded-none border-b-4 border-transparent bg-transparent px-4 py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"><TabAviso n={solicitudes.filter((row) => row.tipo === "llamada_cliente").length}><Package className="h-4 w-4" /> Operación</TabAviso></TabsTrigger>
            <TabsTrigger value="checkin" className="rounded-none border-b-4 border-transparent bg-transparent px-4 py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"><TabAviso rojo n={solicitudes.filter((row) => row.tipo === "check_in").length}><ClipboardCheck className="h-4 w-4" /> Validación de cargas</TabAviso></TabsTrigger>
            <TabsTrigger value="soporte" className="rounded-none border-b-4 border-transparent bg-transparent px-4 py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"><TabAviso n={solicitudes.filter((row) => row.tipo === "soporte").length}><LifeBuoy className="h-4 w-4" /> Soporte en Ruta</TabAviso></TabsTrigger>
            <TabsTrigger value="checkout" className="rounded-none border-b-4 border-transparent bg-transparent px-4 py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"><TabAviso rojo n={solicitudes.filter((row) => row.tipo === "cierre_dia").length}><LogOut className="h-4 w-4" /> Check-out (Cierres)</TabAviso></TabsTrigger>
            <TabsTrigger value="incidencias" className="rounded-none border-b-4 border-transparent bg-transparent px-4 py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"><TabAviso n={solicitudes.filter((row) => row.tipo === "soporte" || row.tipo === "llamada_cliente").length + pedidos.filter((row) => row.estado === "no_entregado" || row.estado_entrega === "fallido").length}><AlertTriangle className="h-4 w-4" /> Incidencias</TabAviso></TabsTrigger>
          </TabsList>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
        <TabsContent value="despacho" className="mt-0 space-y-6">
          <MapaTab icono={Package} titulo="Operación" texto="Pedidos del día, comprobantes y el botón Liberar siguiente." />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5 text-primary" />Cola</CardTitle>
          <CardDescription>Solicitudes que esperan atención</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Repartidor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Pedido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitudes.filter((row) => row.tipo !== "cierre_dia").length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No hay solicitudes en la cola
                  </TableCell>
                </TableRow>
              ) : solicitudes.filter((row) => row.tipo !== "cierre_dia").map((row) => {
                const fresco = avisosCola.some((aviso) => aviso.id === String(row.id));
                const rojo = row.tipo === "check_in";
                return (
                <TableRow
                  key={row.id}
                  data-aviso={rojo || fresco || row.tipo === "soporte" || row.tipo === "llamada_cliente" ? "1" : undefined}
                  onClick={() => {
                    stream?.dismissAviso(String(row.id));
                    if (row.tipo === "check_in") {
                      openValidacion(row.id);
                      return;
                    }
                    void openSolicitud(row.id);
                  }}
                  className={`cursor-pointer ${rojo ? "aviso-rojo" : (fresco || row.tipo === "soporte" || row.tipo === "llamada_cliente") ? "aviso-borde" : ""}`}
                >
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      {row.tipo === "check_in" ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Pendiente</span> : null}
                      {TIPO[row.tipo] || row.tipo}
                    </span>
                  </TableCell>
                  <TableCell>{row.repartidor?.nombre_completo || "—"}</TableCell>
                  <TableCell>{row.fecha} · {row.hora}</TableCell>
                  <TableCell>{row.numero_pedido || "—"}</TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Pedidos del día</CardTitle>
          <CardDescription>Pedidos asignados para hoy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <Select value={ciudadId} onValueChange={(value) => { setCiudadId(value); setRepartidorId("all"); }}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Ciudad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {cities.map((city) => <SelectItem key={city.id} value={String(city.id)}>{city.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={repartidorId} onValueChange={setRepartidorId}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Repartidor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los repartidores</SelectItem>
                {driverOptions.map((driver) => <SelectItem key={driver.id} value={String(driver.id)}>{driver.nombre_completo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <FlujoPasos
            className="mb-4 rounded-lg bg-muted p-4"
            pasos={[
              { titulo: "Horario", texto: "Mañana o Tarde elige cuándo la ve. El botón rosa es el actual. Aplicar a la ruta copia ese horario a toda la ruta." },
              { titulo: "Orden", texto: "Subir y Bajar cambian el lugar de la parada en la ruta." },
              { titulo: "Liberar", texto: "Liberar siguiente es el paso que la muestra en la app. Hasta entonces el repartidor no la ve." },
              { titulo: "Cambiar", texto: "Cambiar sirve para el estado del pedido o para pasarlo a otro repartidor." },
            ]}
          />
          <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Franja</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead>Repartidor</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.filter((row) => row.estado !== "entregado" && row.estado_entrega !== "entregado").length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No hay pedidos para los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : pedidos.filter((row) => row.estado !== "entregado" && row.estado_entrega !== "entregado").map((row) => (
                <TableRow key={row.ruta_pedido_id}>
                  <TableCell>{row.numero_pedido}</TableCell>
                  <TableCell>{row.cliente || "—"}</TableCell>
                  <TableCell>{row.telefono ? <a href={`tel:${row.telefono}`}>{row.telefono}</a> : "—"}</TableCell>
                  <TableCell>{row.direccion || "—"}</TableCell>
                  <TableCell>
                    {row.estado_entrega === "fallido" ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Reagendado</span> : <OrderStatus estado={row.estado} modificado={row.modificado} />}
                    {row.metodo_pago ? <p>{row.metodo_pago}</p> : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-36 flex-col gap-1.5">
                      <div role="group" aria-label={`Horario del pedido ${row.numero_pedido}`} className="flex rounded-md bg-muted p-0.5">
                        {(["manana", "tarde"] as const).map((value) => {
                          const active = (row.franja === "tarde" ? "tarde" : "manana") === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              aria-pressed={active}
                              className={`flex-1 rounded px-2 py-1 text-xs font-semibold ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                              onClick={() => void cambiarFranja(row.id, value)}
                            >
                              {value === "manana" ? "Mañana" : "Tarde"}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void cambiarFranja(row.id, row.franja === "tarde" ? "tarde" : "manana", "ruta")}
                      >
                        Aplicar a la ruta
                      </Button>
                      {row.horario_preferente ? (
                        <p className="text-[11px] text-muted-foreground">A partir de las {row.horario_preferente.slice(0, 5)}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.comprobante_url ? (
                      <button
                        type="button"
                        className="overflow-hidden rounded-md border bg-muted"
                        onClick={() => setReceipt({ url: receiptSrc(row.comprobante_url), numero: row.numero_pedido })}
                        aria-label={`Ver comprobante del pedido ${row.numero_pedido}`}
                      >
                        <img
                          src={receiptSrc(row.comprobante_url)}
                          alt={`Comprobante del pedido ${row.numero_pedido}`}
                          className="h-12 w-12 object-cover"
                        />
                      </button>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{row.repartidor?.nombre_completo || "—"}</TableCell>
                  <TableCell>
                    <div className="flex w-44 flex-col gap-1.5">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => void moverParada(row.id, "subir")}>Subir</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => void moverParada(row.id, "bajar")}>Bajar</Button>
                      </div>
                      <Button size="sm" disabled={trabajando !== ""} onClick={() => void liberarSiguiente(row.id)}>
                        {trabajando === `liberar:${row.id}` ? <Loader2 className="animate-spin" /> : null}
                        {trabajando === `liberar:${row.id}` ? "Liberando…" : "Liberar siguiente"}
                      </Button>
                      {row.estado_entrega === "fallido" ? <Button variant="outline" size="sm" onClick={() => void aCola(row.id)}>A la cola</Button> : null}
                      {statusOptions(row.estado).length > 0 || canReassign(row.estado) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={estadoBusyIds.includes(row.id)}
                          onClick={() => void openCambios(row)}
                        >
                          {estadoBusyIds.includes(row.id) ? "Cambiando…" : "Cambiar"}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" />{comprobantesHistorico ? "Histórico de comprobantes" : "Comprobantes de hoy"}</CardTitle>
          <CardDescription>Cobros y fotos. El comentario queda en la parada de esa entrega.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => {
              if (comprobantesHistorico) {
                setComprobantesHistorico(null);
                return;
              }
              void callCenterService.listarComprobantes({ historico: true }).then(setComprobantesHistorico).catch(notify);
            }}>{comprobantesHistorico ? "Solo hoy" : "Ver histórico"}</Button>
            <Select value={filtroPago} onValueChange={setFiltroPago}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="mixto">Mixto</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
            <Input value={filtroCobro} onChange={(event) => setFiltroCobro(event.target.value)} placeholder="Repartidor o ciudad" className="w-56" />
          </div>
          {(() => {
            const fuente = comprobantesHistorico || comprobantes;
            const q = filtroCobro.trim().toLowerCase();
            const visibles = fuente.filter((row) => {
              if (filtroPago !== "all" && row.metodo !== filtroPago) return false;
              if (!q) return true;
              return `${row.repartidor || ""} ${row.ciudad || ""}`.toLowerCase().includes(q);
            });
            if (visibles.length === 0) return <p className="text-sm text-muted-foreground">No hay comprobantes con ese filtro.</p>;
            return (
            <div className="space-y-3">
              {visibles.map((row) => (
                <div key={`${row.fecha || "hoy"}-${row.pedido_id}`} className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{row.numero_pedido}{row.fecha ? ` · ${String(row.fecha).slice(0, 10)}` : ""}</p>
                    <p className="text-muted-foreground">{row.repartidor || "—"}{row.ciudad ? ` · ${row.ciudad}` : ""} · {row.metodo}</p>
                    {row.nota ? <p>{row.nota}</p> : null}
                  </div>
                  {row.comprobante_url ? (
                    <button
                      type="button"
                      className="overflow-hidden rounded-md border bg-muted"
                      onClick={() => setReceipt({ url: receiptSrc(row.comprobante_url), numero: row.numero_pedido })}
                      aria-label={`Ver comprobante del pedido ${row.numero_pedido}`}
                    >
                      <img src={receiptSrc(row.comprobante_url)} alt="" className="h-12 w-12 object-cover" />
                    </button>
                  ) : row.puede_subir ? (
                    <label className="cursor-pointer text-sm font-medium text-primary">
                      Subir foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) return;
                          void callCenterService.subirComprobante(row.pedido_id, file)
                            .then(() => loadLists())
                            .catch(notify);
                        }}
                      />
                    </label>
                  ) : "—"}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={notaCobro[row.pedido_id] || ""}
                      onChange={(event) => setNotaCobro((prev) => ({ ...prev, [row.pedido_id]: event.target.value }))}
                      placeholder="Comentario de este comprobante"
                    />
                    <Button variant="outline" onClick={() => {
                      const texto = (notaCobro[row.pedido_id] || "").trim();
                      if (texto.length < 2) return;
                      void callCenterService.anotarComprobante(row.pedido_id, texto)
                        .then(() => loadLists())
                        .catch(notify);
                    }}>Guardar</Button>
                  </div>
                </div>
              ))}
            </div>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Depósitos del día</CardTitle>
          <CardDescription>Siguen visibles después de liberar el cierre</CardDescription>
        </CardHeader>
        <CardContent>
          {depositos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay depósitos de hoy.</p>
          ) : (
            <div className="space-y-3">
              {depositos.map((row) => (
                <div key={row.jornada_id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{row.repartidor || "Repartidor"}</p>
                    <p className="text-muted-foreground">Efectivo ${formatMoney(row.efectivo_a_depositar)}</p>
                  </div>
                  {row.comprobante_url ? (
                    <button
                      type="button"
                      className="overflow-hidden rounded-md border bg-muted"
                      onClick={() => setReceipt({ url: receiptSrc(row.comprobante_url), numero: row.repartidor || "deposito" })}
                      aria-label={`Ver depósito de ${row.repartidor || "repartidor"}`}
                    >
                      <img src={receiptSrc(row.comprobante_url)} alt="" className="h-12 w-12 object-cover" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detail != null} onOpenChange={(open) => { if (!open) dismissDetail(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detail ? TIPO[detail.tipo] : ""}</DialogTitle></DialogHeader>
          {detail && detail.tipo === "cierre_dia" && (
            <div className="space-y-3">
              <p>{detail.repartidor?.nombre_completo || "Repartidor"}</p>
              <p>Efectivo a depositar ${formatMoney(detail.efectivo_a_depositar || 0)}</p>
              {detail.comprobante_url ? (
                <button
                  type="button"
                  className="block overflow-hidden rounded-md border"
                  onClick={() => setReceipt({
                    url: receiptSrc(detail.comprobante_url),
                    numero: detail.repartidor?.nombre_completo || "deposito",
                  })}
                >
                  <img
                    src={receiptSrc(detail.comprobante_url)}
                    alt="Comprobante del depósito"
                    className="max-h-64 w-full object-contain"
                  />
                </button>
              ) : null}
              {puedeAutorizarExcepcion() ? (
                <Button size="lg" className="h-12 px-8" disabled={busy} onClick={() => detail && void aprobarCierre(detail.id)}>
                  {busy ? <Loader2 className="animate-spin" /> : null}
                  {busy ? "Aprobando…" : "Aprobar Check-out"}
                </Button>
              ) : <p>Solo un super admin puede aprobar el check-out.</p>}
            </div>
          )}
          {detail && detail.tipo !== "check_in" && detail.tipo !== "cierre_dia" && (
            <div className="space-y-3">
              <p>{detail.repartidor?.nombre_completo}</p>
              <p>Pedido {detail.numero_pedido || "—"}</p>
              <p>{detail.cliente}</p>
              {detail.telefono && <a href={`tel:${detail.telefono}`}>{detail.telefono}</a>}
              <p>{detail.direccion}</p>
              <p>{detail.motivo}</p>
              {detail.ayuda === "codigo" && (
                <div className="space-y-2 rounded-md bg-primary/10 p-3">
                  <p className="text-sm">El repartidor no tiene el código del cliente.</p>
                  {codigoAyuda ? <p className="text-2xl font-semibold tracking-widest">{codigoAyuda}</p> : (
                    <Button variant="outline" disabled={busy} onClick={() => void resolverAyuda(detail.id, "ver_codigo")}>Ver código</Button>
                  )}
                  {puedeAutorizarExcepcion() ? (
                    <Button disabled={busy} onClick={() => void resolverAyuda(detail.id, "aprobar_codigo")}>Aprobar entrega sin código</Button>
                  ) : (
                    <p className="text-sm">Solo un super admin puede aprobar la entrega sin código.</p>
                  )}
                </div>
              )}
              {detail.ayuda === "tercero" && (
                puedeAutorizarExcepcion() ? (
                  <div className="space-y-2 rounded-md bg-primary/10 p-3">
                    <label className="block text-sm" htmlFor="quien-recibe">Quién recibe</label>
                    <input
                      id="quien-recibe"
                      value={receptor}
                      onChange={(event) => setReceptor(event.target.value)}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    />
                    <Button disabled={busy || receptor.trim().length < 2} onClick={() => void resolverAyuda(detail.id, "autorizar_tercero")}>Autorizar entrega a otra persona</Button>
                  </div>
                ) : (
                  <p className="text-sm">Solo un super admin puede autorizar la entrega a otra persona.</p>
                )
              )}
              <Textarea value={nota} onChange={(event) => setNota(event.target.value)} placeholder="Nota opcional" />
              <Button disabled={busy} onClick={() => void atender()}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                {busy ? "Marcando atendido…" : "Atendido"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reassignFor != null} onOpenChange={(open) => { if (!open) closeReassign(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cambiar pedido {reassignFor?.numero_pedido}</DialogTitle></DialogHeader>
          {reassignFor && (
            <div className="space-y-4">
              <OrderStatus estado={reassignFor.estado} modificado={reassignFor.modificado} />
              {statusOptions(reassignFor.estado).length > 0 && (
                <div className="space-y-2">
                  <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                    <SelectTrigger><SelectValue placeholder="Nuevo estado" /></SelectTrigger>
                    <SelectContent>
                      {statusOptions(reassignFor.estado).map((estado) => (
                        <SelectItem key={estado} value={estado}>{statusLabel(estado)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!nuevoEstado || estadoBusyIds.includes(reassignFor.id)}
                    onClick={() => void aplicarEstado()}
                  >
                    Actualizar estado
                  </Button>
                </div>
              )}
              {!["entregado", "cancelado", "no_entregado"].includes(reassignFor.estado) && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Si el cliente no recibió el paquete, ciérralo aquí. No hace falta el código de la app. El motivo queda en el historial.</p>
                  <Textarea value={motivoCierre} onChange={(event) => setMotivoCierre(event.target.value)} placeholder="Por qué se cierra sin código" />
                  <Button
                    variant="outline"
                    disabled={busy || motivoCierre.trim().length < 5}
                    onClick={() => void cerrarSinCodigo()}
                  >
                    {busy ? "Cerrando…" : "Cerrar sin código"}
                  </Button>
                </div>
              )}
              {canReassign(reassignFor.estado) && (
                <div className="space-y-2">
                  <Select value={targetDriver} onValueChange={setTargetDriver}>
                    <SelectTrigger><SelectValue placeholder="Reasignar repartidor" /></SelectTrigger>
                    <SelectContent>
                      {drivers.filter((driver) => driver.id !== reassignFor.repartidor?.id).map((driver) => (
                        <SelectItem key={driver.id} value={String(driver.id)}>{driver.nombre_completo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button disabled={busy || !targetDriver} onClick={() => void confirmReassign()}>Reasignar</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>
        <TabsContent value="soporte" className="mt-0">
          <MonitorRepartidores
            pedidos={pedidos}
            solicitudes={solicitudes}
            puede={puedeAutorizarExcepcion()}
            busy={busy}
            codigo={codigoAyuda}
            codigoDe={codigoDe}
            receptor={receptor}
            onReceptor={setReceptor}
            onAyuda={(id, accion) => void resolverAyuda(id, accion)}
            onAtender={(id) => void atender(id)}
            abiertoId={solicitudes.find((row) => row.id === avisoId)?.repartidor?.id ?? (Number(searchParams.get("repartidor")) || null)}
            velocidades={velocidades}
            comprobantes={comprobantes}
            depositos={depositos}
            cities={cities}
            onError={notify}
            onChanged={() => { void loadLists().catch(notify); }}
            onReceipt={(url, numero) => setReceipt({ url, numero })}
          />
        </TabsContent>
        <TabsContent value="checkout" className="mt-0">
          <CheckoutDia
            pedidos={pedidos}
            solicitudes={solicitudes}
            cities={cities}
            busy={busy}
            puede={puedeAutorizarExcepcion()}
            onCerrar={(id) => void cerrarDirecto(id)}
            onAprobar={(id) => void aprobarCierre(id)}
          />
        </TabsContent>
        <TabsContent value="incidencias" className="mt-0 space-y-6">
          <IncidenciasPanel
            pedidos={pedidos}
            solicitudes={solicitudes}
            superAdmin={puedeAutorizarExcepcion()}
            onChanged={() => { void loadLists().catch(notify); }}
            onError={notify}
            onAbrir={(repartidorId) => setSearchParams({ tab: "soporte", repartidor: String(repartidorId) })}
          />
        </TabsContent>
        <TabsContent value="checkin" className="mt-0 space-y-6">
          <MapaTab icono={ClipboardCheck} titulo="Validación de cargas" texto="Aquí se aprueban las cargas antes de que el repartidor salga." />
          {!cargaId && (
            <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-foreground">
              <p className="font-semibold">Aquí se aprueba la carga antes de que el repartidor salga.</p>
              <p className="mt-1 text-muted-foreground">El repartidor la envía desde la app, en Check-in, con Enviar a call-center. Cuando llegue, ábrela en la tabla y pulsa Aprobar carga. Si ya se aprobó, queda en el histórico.</p>
            </div>
          )}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />Por validar</CardTitle>
                <CardDescription>Cargas de check-in pendientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repartidor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          No hay cargas esperando validación. Cuando el repartidor pulse Enviar a call-center, aparece aquí.
                        </TableCell>
                      </TableRow>
                    ) : pendientes.map((row) => (
                      <TableRow key={row.id} data-aviso="1" className="aviso-rojo">
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
                            {row.repartidor?.nombre_completo || "—"}
                          </span>
                        </TableCell>
                        <TableCell>{row.fecha}</TableCell>
                        <TableCell>{row.hora}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => openValidacion(row.id)}>
                            {cargaId === row.id ? "Abierta" : "Aprobar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          {cargaId ? (
            <div ref={cargaPanel} className="rounded-xl border border-primary/30 bg-pink-50 p-4">
              <ValidacionCarga
                key={cargaId}
                solicitudId={cargaId}
                embedded
                onBack={closeValidacion}
                onApproved={() => {
                  closeValidacion();
                  setHistorialTick((current) => current + 1);
                  void loadLists().catch(notify);
                }}
              />
            </div>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Histórico</CardTitle>
              <CardDescription>Cargas ya validadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repartidor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Dinero esperado</TableHead>
                    <TableHead>Validó</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Aún no hay cargas validadas
                      </TableCell>
                    </TableRow>
                  ) : historial.map((row) => {
                    const abierto = historialId === row.id;
                    const total = (row.cargas || []).reduce((sum, linea) => sum + (Number(linea.cantidad) || 0) * (Number(linea.precio_unitario) || 0), 0);
                    return (
                    <Fragment key={row.id}>
                    <TableRow
                      onClick={() => setHistorialId((current) => current === row.id ? null : row.id)}
                      className={abierto ? "cursor-pointer shadow-[inset_4px_0_0_hsl(var(--primary))]" : "cursor-pointer"}
                    >
                      <TableCell>{row.repartidor?.nombre_completo || "—"}</TableCell>
                      <TableCell>{row.fecha}</TableCell>
                      <TableCell>{row.hora}</TableCell>
                      <TableCell>${formatMoney(Number(row.dinero_esperado) || 0)}</TableCell>
                      <TableCell>{row.validado_por_nombre || "—"}</TableCell>
                    </TableRow>
                    {abierto ? (
                      <TableRow className="bg-pink-100 shadow-[inset_4px_0_0_hsl(var(--primary))] hover:bg-pink-100">
                        <TableCell colSpan={5} className="bg-pink-100">
                          <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr] gap-x-3 gap-y-2 text-sm text-foreground">
                            <p className="font-medium">Producto</p>
                            <p className="font-medium">Cantidad</p>
                            <p className="font-medium">Precio</p>
                            <p className="font-medium">Tipo</p>
                            {(row.cargas || []).map((linea) => (
                              <Fragment key={`${linea.fkid_producto ?? linea.nombre}-${linea.es_extra}`}>
                                <p>{linea.nombre}</p>
                                <p>{linea.cantidad}</p>
                                <p>${formatMoney(Number(linea.precio_unitario) || 0)}</p>
                                <p>{linea.es_extra ? "extra" : ""}</p>
                              </Fragment>
                            ))}
                          </div>
                          <p className="mt-3 text-base font-semibold text-foreground">Total del pedido ${formatMoney(total)}</p>
                        </TableCell>
                      </TableRow>
                    ) : null}
                    </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>
      <Dialog open={receipt != null} onOpenChange={(open) => { if (!open) setReceipt(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comprobante {receipt?.numero}</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-4">
              <img
                src={receipt.url}
                alt={`Comprobante del pedido ${receipt.numero}`}
                className="max-h-[70vh] w-full rounded-md object-contain"
              />
              <Button disabled={downloading} onClick={() => void downloadReceipt()}>
                <Download className="mr-2 h-4 w-4" />
                {downloading ? "Descargando..." : "Descargar"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
};

export default CallCenter;
