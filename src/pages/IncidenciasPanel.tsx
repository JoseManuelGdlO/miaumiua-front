import { useEffect, useState } from "react";
import { AlertTriangle, Archive, CalendarClock, Pencil, Phone, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TablePagination } from "@/components/TablePagination";
import { callCenterService, type PedidoDia, type Solicitud } from "@/services/callCenterService";

const PAGE_SIZE = 8;
const INCIDENCIAS_DESDE = "2026-11-12";

type Confirmacion = {
  kind: "solicitud" | "pedido";
  id: number;
  accion: "archivar" | "solucionar";
};

function fechaMexico(delta: number) {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
  const [y, m, d] = hoy.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

function diaDe(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw) || /T|\d{2}:\d{2}/.test(raw)) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(date);
    }
  }
  return raw.slice(0, 10);
}

type Props = {
  pedidos: PedidoDia[];
  solicitudes: Solicitud[];
  superAdmin: boolean;
  onChanged: () => void;
  onError: (error: unknown) => void;
  onAbrir: (repartidorId: number) => void;
};

export default function IncidenciasPanel({ pedidos, solicitudes, superAdmin, onChanged, onError, onAbrir }: Props) {
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");
  const [dia, setDia] = useState("");
  const [page, setPage] = useState(1);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [archivadas, setArchivadas] = useState<Solicitud[]>([]);
  const [archivadosPedidos, setArchivadosPedidos] = useState<PedidoDia[]>([]);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const texto = q.trim().toLowerCase();
  const alertaPedido = (fecha?: string | null) => {
    const dia = diaDe(fecha);
    if (!dia) return true;
    const hoy = fechaMexico(0);
    const start = Date.parse(`${dia}T00:00:00.000Z`);
    const today = Date.parse(`${hoy}T00:00:00.000Z`);
    if (Number.isNaN(start) || Number.isNaN(today)) return true;
    const days = Math.round((today - start) / 86400000);
    return days >= 0 && days < 5;
  };
  const problemas = (verArchivadas ? archivadas : solicitudes).filter((row) => {
    if (row.tipo !== "llamada_cliente" && row.tipo !== "soporte") return false;
    if (estado === "no_entregado") return false;
    if (estado === "soporte" && row.tipo !== "soporte") return false;
    if (estado === "llamada" && row.tipo !== "llamada_cliente") return false;
    if (dia && diaDe(row.fecha) !== dia) return false;
    if (texto && !`${row.repartidor?.nombre_completo || ""} ${row.motivo || ""}`.toLowerCase().includes(texto)) return false;
    return true;
  });
  useEffect(() => {
    if (!verArchivadas) return;
    let vivo = true;
    callCenterService.listarIncidenciasArchivadas().then((data) => {
      if (!vivo) return;
      if (Array.isArray(data)) {
        setArchivadas(data);
        setArchivadosPedidos([]);
        return;
      }
      setArchivadas(data.solicitudes || []);
      setArchivadosPedidos(data.pedidos || []);
    }).catch(onError);
    return () => { vivo = false; };
  }, [verArchivadas, onError]);

  const noEntregados = (verArchivadas ? archivadosPedidos : pedidos).filter((row) => {
    if (!verArchivadas && row.incidencia) return false;
    if (!verArchivadas && (row.estado !== "no_entregado" && row.estado_entrega !== "fallido")) return false;
    if (estado === "soporte" || estado === "llamada") return false;
    const surgio = diaDe(row.fecha_incidencia || row.fecha_ruta);
    if (!verArchivadas && surgio && surgio < INCIDENCIAS_DESDE) return false;
    if (!verArchivadas && !row.repartidor && !surgio) return false;
    if (dia && surgio !== dia) return false;
    if (texto && !`${row.repartidor?.nombre_completo || ""} ${row.numero_pedido || ""} ${row.cliente || ""}`.toLowerCase().includes(texto)) return false;
    return true;
  }).sort((a, b) => Number(Boolean(a.fecha_propuesta)) - Number(Boolean(b.fecha_propuesta)));
  const filas = [
    ...problemas.map((row) => ({ kind: "solicitud" as const, row })),
    ...noEntregados.map((row) => ({ kind: "pedido" as const, row })),
  ];
  const totalFilas = filas.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(totalFilas / PAGE_SIZE) || 1));
  const visibles = filas.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const marcarLlamada = async (id: number) => {
    setBusy(true);
    try {
      await callCenterService.atender(id);
      onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const liberar = async (id: number) => {
    setBusy(true);
    try {
      await callCenterService.liberarIntento(id);
      onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };
  const modificados = pedidos.filter((row) => row.modificado);

  const confirmarAccion = async (elegida: Confirmacion) => {
    setBusy(true);
    try {
      if (elegida.kind === "solicitud") {
        await callCenterService.archivar(elegida.id, elegida.accion);
      } else {
        await callCenterService.cerrarIncidenciaPedido(elegida.id, elegida.accion);
      }
      setConfirmacion(null);
      if (verArchivadas) {
        const data = await callCenterService.listarIncidenciasArchivadas();
        if (Array.isArray(data)) {
          setArchivadas(data);
          setArchivadosPedidos([]);
        } else {
          setArchivadas(data.solicitudes || []);
          setArchivadosPedidos(data.pedidos || []);
        }
      }
      onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const reagendar = async () => {
    if (pedidoId == null || !fecha || !motivo.trim()) return;
    setBusy(true);
    try {
      await callCenterService.reagendar(pedidoId, fecha, motivo.trim());
      setMotivo("");
      setFecha("");
      onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" />Problemas</CardTitle>
            <CardDescription>{verArchivadas ? "Incidencias archivadas." : "Llamadas, soporte y pedidos no entregados. El aviso dura 5 días. Archiva cuando ya no aplique."}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setVerArchivadas((v) => !v); setPage(1); setAbierto(null); }}>
            <Archive className="mr-2 h-4 w-4" />{verArchivadas ? "Ver abiertas" : "Ver archivadas"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-3">
            <Input aria-label="Filtrar por repartidor" value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Filtrar por repartidor" className="w-56" />
            <Input aria-label="Día en que surgió la incidencia" type="date" value={dia} onChange={(event) => { setDia(event.target.value); setPage(1); }} className="w-56" />
            <Select value={estado} onValueChange={(value) => { setEstado(value); setPage(1); }}>
              <SelectTrigger className="w-56" aria-label="Filtrar por estado"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="soporte">Soporte</SelectItem>
                <SelectItem value="llamada">Llamada</SelectItem>
                {verArchivadas ? null : <SelectItem value="no_entregado">No entregado</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {problemas.length === 0 && noEntregados.length === 0 ? (
            <p className="text-muted-foreground">{verArchivadas ? "No hay incidencias archivadas" : "No hay problemas abiertos"}</p>
          ) : null}
          {visibles.map((item) => item.kind === "solicitud" ? (
            <div key={`s-${item.row.id}`} className={`${verArchivadas || item.row.alerta === false ? "" : "aviso-borde "}flex items-start justify-between gap-3 rounded-md bg-background px-3 py-2`}>
              <button type="button" className="text-left" onClick={() => setAbierto((current) => current === `s-${item.row.id}` ? null : `s-${item.row.id}`)}>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.row.tipo === "llamada_cliente" ? "bg-sky-100 text-sky-900" : "bg-amber-100 text-amber-900"}`}>{item.row.tipo === "llamada_cliente" ? "Llamada" : "Incidencia"}</span>
                <span className="mt-1 block font-semibold">{item.row.repartidor?.nombre_completo || "Sin repartidor"} · {item.row.numero_pedido || "Sin pedido"}</span>
                <span className="mt-1 block text-muted-foreground">{item.row.fecha} {item.row.hora} · {item.row.nota || item.row.motivo || "Sin motivo"}</span>
                {abierto === `s-${item.row.id}` ? (
                  <span className="mt-2 block space-y-1 text-muted-foreground">
                    {item.row.descripcion ? <span className="block">{item.row.descripcion}</span> : null}
                    {item.row.cliente ? <span className="block">{item.row.cliente}</span> : null}
                    {item.row.telefono ? <span className="block">{item.row.telefono}</span> : null}
                    {item.row.direccion ? <span className="block">{item.row.direccion}</span> : null}
                    {item.row.ayuda ? <span className="block">Ayuda: {item.row.ayuda}</span> : null}
                    {!item.row.descripcion && !item.row.cliente && !item.row.telefono && !item.row.direccion && !item.row.ayuda ? <span className="block">Sin más detalles</span> : null}
                  </span>
                ) : null}
              </button>
              <div className="flex flex-col gap-2">
                {verArchivadas ? (item.row.solucionada ? <span className="text-xs font-semibold text-muted-foreground">Solucionada</span> : <span className="text-xs font-semibold text-muted-foreground">Archivada</span>) : (
                  <>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmacion({ kind: "solicitud", id: item.row.id, accion: "archivar" })}>Archivar</Button>
                    <Button size="sm" disabled={busy} onClick={() => setConfirmacion({ kind: "solicitud", id: item.row.id, accion: "solucionar" })}>Solucionado</Button>
                  </>
                )}
                {item.row.tipo === "llamada_cliente" && !item.row.llamada_atendida && !verArchivadas ? <Button size="sm" disabled={busy} onClick={() => void marcarLlamada(item.row.id)}>Ya llamé al cliente</Button> : null}
                {item.row.tipo === "llamada_cliente" && item.row.llamada_atendida && !verArchivadas ? <Button size="sm" disabled={busy} onClick={() => void liberar(item.row.id)}>Liberar intento</Button> : null}
                {(item.row.motivo === "averia" || item.row.motivo === "clima") && item.row.repartidor?.id ? <Button variant="outline" size="sm" onClick={() => onAbrir(item.row.repartidor.id)}>Elegir clientes</Button> : null}
                {item.row.pedido_id && item.row.motivo !== "averia" && item.row.motivo !== "clima" && !verArchivadas ? <Button variant="outline" size="sm" onClick={() => { setPedidoId(item.row.pedido_id); setFecha(item.row.fecha_propuesta || fechaMexico(1)); setMotivo(item.row.fecha_propuesta ? "Cliente por WhatsApp" : ""); }}>Reagendar</Button> : null}
              </div>
            </div>
          ) : (
            <div key={`p-${item.row.id}`} data-aviso={!verArchivadas && alertaPedido(item.row.fecha_incidencia || item.row.fecha_ruta) ? "1" : undefined} className={`${!verArchivadas && alertaPedido(item.row.fecha_incidencia || item.row.fecha_ruta) ? "aviso-borde " : ""}flex items-start justify-between gap-3 rounded-md bg-background px-3 py-2`}>
              <button type="button" className="text-left" onClick={() => setAbierto((current) => current === `p-${item.row.id}` ? null : `p-${item.row.id}`)}>
                <span className="inline-flex items-center gap-2">
                  {alertaPedido(item.row.fecha_incidencia || item.row.fecha_ruta) ? <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden /> : null}
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">No entregado</span>
                </span>
                <span className="mt-1 block font-semibold">{item.row.numero_pedido} · {item.row.cliente || "Sin cliente"}</span>
                <span className="mt-1 block text-muted-foreground">{item.row.repartidor?.nombre_completo || "Sin repartidor"}{item.row.fecha_propuesta ? ` · Propone ${item.row.fecha_propuesta}` : " · Sin fecha confirmada"}</span>
                {abierto === `p-${item.row.id}` ? (
                  <span className="mt-2 block space-y-1 text-muted-foreground">
                    {item.row.telefono ? <span className="block">{item.row.telefono}</span> : null}
                    {item.row.direccion ? <span className="block">{item.row.direccion}</span> : null}
                    {item.row.notas ? <span className="block">{item.row.notas}</span> : null}
                    {!item.row.telefono && !item.row.direccion && !item.row.notas ? <span className="block">Sin más detalles</span> : null}
                  </span>
                ) : null}
              </button>
              <div className="flex flex-col gap-2">
                {verArchivadas ? (item.row.incidencia === "solucionada" ? <span className="text-xs font-semibold text-muted-foreground">Solucionada</span> : <span className="text-xs font-semibold text-muted-foreground">Archivada</span>) : (
                  <>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmacion({ kind: "pedido", id: item.row.id, accion: "archivar" })}>Archivar</Button>
                    <Button size="sm" disabled={busy} onClick={() => setConfirmacion({ kind: "pedido", id: item.row.id, accion: "solucionar" })}>Solucionado</Button>
                    <Button variant="outline" size="sm" onClick={() => { setPedidoId(item.row.id); setFecha(item.row.fecha_propuesta || fechaMexico(1)); if (item.row.fecha_propuesta) setMotivo("Cliente por WhatsApp"); }}>Reagendar</Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {totalFilas > PAGE_SIZE ? (
            <TablePagination page={safePage} pageSize={PAGE_SIZE} total={totalFilas} label="incidencias" onPageChange={setPage} />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary" />Pedidos modificados</CardTitle>
          <CardDescription>Cantidades o forma de pago distintas a las originales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {modificados.length === 0 ? <p className="text-muted-foreground">Ningún pedido fue modificado</p> : null}
          {modificados.map((row) => (
            <button key={row.id} type="button" onClick={() => { setPedidoId(row.id); setFecha(fechaMexico(1)); }} className="block w-full rounded-md bg-muted px-3 py-2 text-left">
              <b>{row.numero_pedido}</b> · {row.cliente || "Sin cliente"} · {row.repartidor?.nombre_completo || "Sin repartidor"}
              {row.notas ? <span className="mt-1 block text-muted-foreground">{row.notas}</span> : null}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" />Reagendar</CardTitle>
          <CardDescription>El pedido sale de la ruta de hoy y queda en la fecha elegida. No se mueve solo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{pedidoId == null ? "Elige un pedido de las listas." : `Pedido #${pedidoId}`}</p>
          <Input type="date" min={superAdmin ? fechaMexico(0) : fechaMexico(1)} value={fecha} onChange={(event) => setFecha(event.target.value)} aria-label="Nueva fecha" />
          <Textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Motivo" />
          <Button size="lg" className="h-12 px-8" disabled={busy || pedidoId == null || !fecha || !motivo.trim()} onClick={() => void reagendar()}>
            {fecha === fechaMexico(0) ? "Reagendar el mismo día" : fecha === fechaMexico(1) ? "Reagendar al día siguiente" : "Reagendar"}
          </Button>
          {superAdmin ? <p className="text-sm text-muted-foreground">Como super admin puedes elegir la fecha de hoy.</p> : null}
        </CardContent>
      </Card>

      <AlertDialog open={confirmacion != null} onOpenChange={(open) => { if (!open) setConfirmacion(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmacion?.accion === "solucionar"
                ? "¿Marcar esta incidencia como solucionada?"
                : "¿Archivar esta incidencia?"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(event) => {
              event.preventDefault();
              if (confirmacion) void confirmarAccion(confirmacion);
            }}>
              {confirmacion?.accion === "solucionar" ? "Sí, solucionada" : "Sí, archivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ContactosIncidencia superAdmin={superAdmin} onError={onError} />
    </div>
  );
}

function iniciales(nombre: string) {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase() || "").join("");
}

type LineaContacto = { telefono: string; repartidor_ids: number[] };
type PersonaContacto = { id: number; nombre: string; telefono: string; repartidor_ids: number[]; numeros: LineaContacto[] };

function conNumeros(persona: { id: number; nombre: string; telefono: string; repartidor_ids: number[]; numeros?: LineaContacto[] }): PersonaContacto {
  const numeros = persona.numeros?.length ? persona.numeros : [{ telefono: persona.telefono, repartidor_ids: persona.repartidor_ids }];
  return { ...persona, numeros, repartidor_ids: numeros.flatMap((linea) => linea.repartidor_ids) };
}

function ContactosIncidencia({ superAdmin, onError }: { superAdmin: boolean; onError: (error: unknown) => void }) {
  const [personas, setPersonas] = useState<PersonaContacto[]>([]);
  const [repartidores, setRepartidores] = useState<{ id: number; nombre: string }[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [quitarDe, setQuitarDe] = useState<{ personaId: number; index: number; repartidorId: number; nombre: string } | null>(null);
  const [listoId, setListoId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "asignados" | "sin">("todos");
  const [editando, setEditando] = useState<string | null>(null);
  const [picker, setPicker] = useState("");

  useEffect(() => {
    let vivo = true;
    callCenterService.listContactos().then((data) => {
      if (!vivo) return;
      setPersonas(data.personas.map(conNumeros));
      setRepartidores(data.repartidores);
    }).catch(onError);
    return () => { vivo = false; };
  }, []);

  const texto = busqueda.trim().toLowerCase();
  const visibles = personas.filter((persona) => {
    if (texto && !persona.nombre.toLowerCase().includes(texto)) return false;
    if (filtro === "asignados") return persona.repartidor_ids.length > 0;
    if (filtro === "sin") return persona.repartidor_ids.length === 0;
    return true;
  });
  const ocupados = new Set(personas.flatMap((persona) => persona.repartidor_ids));
  const [personaEdit, lineaEdit] = (editando || "").split(":").map(Number);
  const base = personas.find((persona) => persona.id === personaEdit);
  const lineaBase = base?.numeros[lineaEdit];
  const sugeridos = repartidores.filter((repartidor) => {
    if (!lineaBase || lineaBase.repartidor_ids.includes(repartidor.id)) return false;
    if (picker.trim() && !repartidor.nombre.toLowerCase().includes(picker.trim().toLowerCase())) return false;
    return true;
  }).slice(0, 8);

  const guardar = async (personaId: number) => {
    const persona = personas.find((row) => row.id === personaId);
    if (!persona) return;
    setGuardando(true);
    try {
      await callCenterService.guardarContacto(persona.id, persona.numeros);
      setListoId(persona.id);
    } catch (error) {
      onError(error);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarLinea = (personaId: number, index: number, patch: Partial<LineaContacto>) => {
    setListoId(null);
    setPersonas((lista) => lista.map((persona) => {
      if (persona.id !== personaId) return persona;
      const numeros = persona.numeros.map((linea, i) => i === index ? { ...linea, ...patch } : linea);
      if (index >= persona.numeros.length) numeros.push({ telefono: "", repartidor_ids: [], ...patch });
      return { ...persona, numeros, telefono: numeros[0]?.telefono || "", repartidor_ids: numeros.flatMap((linea) => linea.repartidor_ids) };
    }));
  };

  const quitar = (personaId: number, index: number, repartidorId: number) => {
    const persona = personas.find((row) => row.id === personaId);
    cambiarLinea(personaId, index, { repartidor_ids: (persona?.numeros[index]?.repartidor_ids || []).filter((id) => id !== repartidorId) });
  };

  const agregar = (personaId: number, index: number, repartidorId: number) => {
    setPicker("");
    setPersonas((lista) => lista.map((persona) => {
      const numeros = persona.numeros.map((linea, i) => {
        const ids = linea.repartidor_ids.filter((id) => id !== repartidorId);
        if (persona.id === personaId && i === index) return { ...linea, repartidor_ids: [...ids, repartidorId] };
        return { ...linea, repartidor_ids: ids };
      });
      return { ...persona, numeros, repartidor_ids: numeros.flatMap((linea) => linea.repartidor_ids) };
    }));
  };

  return (
    <section className="space-y-4 rounded-xl bg-muted/40 p-4" data-ui>
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Users className="h-5 w-5 text-primary" />Contactos de Soporte y Asignación</h2>
        <p className="mt-1">Un agente puede tener varios números. Cada número lleva su grupo de repartidores. Solo un super admin los cambia.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Input aria-label="Buscar agente" value={busqueda} placeholder="Buscar agente" onChange={(event) => setBusqueda(event.target.value)} className="max-w-sm" />
        <Select value={filtro} onValueChange={(value) => setFiltro(value as "todos" | "asignados" | "sin")}>
          <SelectTrigger className="w-56" aria-label="Filtrar agentes"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="asignados">Asignados</SelectItem>
            <SelectItem value="sin">Sin asignar</SelectItem>
          </SelectContent>
        </Select>
        <p>{personas.length} con acceso · {ocupados.size} repartidores asignados</p>
      </div>
      {visibles.length === 0 ? <p>Nadie coincide con esa búsqueda.</p> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((persona, index) => (
              <div key={persona.id} className={`space-y-3 rounded-xl p-4 ${index % 2 === 0 ? "bg-white" : "bg-pink-50"}`}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{iniciales(persona.nombre)}</span>
                  <div>
                    <p className="text-lg font-semibold">{persona.nombre}</p>
                    <p className="text-sm text-muted-foreground">{superAdmin ? "Editable" : "Solo lectura"}</p>
                  </div>
                </div>
                {persona.numeros.map((linea, lineaIndex) => (
                  <div key={`${persona.id}-${lineaIndex}`} className="space-y-2">
                    <label className="block" htmlFor={`tel-${persona.id}-${lineaIndex}`}>Teléfono {lineaIndex + 1}</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id={`tel-${persona.id}-${lineaIndex}`}
                        value={linea.telefono}
                        readOnly={!superAdmin}
                        className="pl-9"
                        onChange={(event) => cambiarLinea(persona.id, lineaIndex, { telefono: event.target.value })}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {linea.repartidor_ids.length === 0 ? <p className="text-sm text-muted-foreground">Ningún repartidor</p> : linea.repartidor_ids.map((id) => (
                        <span key={id} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                          {repartidores.find((row) => row.id === id)?.nombre || `Repartidor ${id}`}
                          {superAdmin ? <button type="button" aria-label={`Quitar ${repartidores.find((row) => row.id === id)?.nombre || id}`} onClick={() => setQuitarDe({ personaId: persona.id, index: lineaIndex, repartidorId: id, nombre: repartidores.find((row) => row.id === id)?.nombre || `Repartidor ${id}` })}>×</button> : null}
                        </span>
                      ))}
                    </div>
                    {superAdmin ? (
                      <>
                        <Input
                          aria-label={`Asignar repartidor al teléfono ${lineaIndex + 1} de ${persona.nombre}`}
                          value={editando === `${persona.id}:${lineaIndex}` ? picker : ""}
                          placeholder="Buscar y asignar repartidor"
                          onChange={(event) => {
                            setEditando(`${persona.id}:${lineaIndex}`);
                            setPicker(event.target.value);
                          }}
                        />
                        {editando === `${persona.id}:${lineaIndex}` && picker.trim() ? sugeridos.map((repartidor) => (
                          <button key={repartidor.id} type="button" className="block w-full bg-background px-3 py-2 text-left" onClick={() => agregar(persona.id, lineaIndex, repartidor.id)}>
                            {repartidor.nombre}{ocupados.has(repartidor.id) ? " · pasa a este número" : ""}
                          </button>
                        )) : null}
                      </>
                    ) : null}
                  </div>
                ))}
                {superAdmin ? (
                  <div className="flex flex-col gap-6 pt-2">
                    <Button variant="outline" onClick={() => cambiarLinea(persona.id, persona.numeros.length, { telefono: "", repartidor_ids: [] })}>Otro número</Button>
                    <Button disabled={guardando || persona.numeros.some((linea) => linea.telefono.trim().length < 8)} onClick={() => void guardar(persona.id)}>
                      {guardando ? "Guardando…" : "Guardar contacto"}
                    </Button>
                    {listoId === persona.id ? <p>Contacto guardado. La app usará estos números.</p> : null}
                  </div>
                ) : <p>Solo un super admin puede cambiar números y repartidores.</p>}
              </div>
          ))}
        </div>
      )}
      <AlertDialog open={quitarDe != null} onOpenChange={(open) => { if (!open) setQuitarDe(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que deseas eliminar a {quitarDe?.nombre || "este repartidor"} del contacto?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const elegido = quitarDe;
              setQuitarDe(null);
              if (elegido) quitar(elegido.personaId, elegido.index, elegido.repartidorId);
            }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
