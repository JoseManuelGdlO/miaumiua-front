import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, Pencil, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { callCenterService, type PedidoDia, type Solicitud } from "@/services/callCenterService";
import { authService } from "@/services/authService";

function fechaMexico(delta: number) {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
  const [y, m, d] = hoy.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
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
  const problemas = solicitudes.filter((row) => row.tipo === "llamada_cliente" || row.tipo === "soporte");
  const noEntregados = pedidos.filter((row) => row.estado === "no_entregado");
  const modificados = pedidos.filter((row) => row.modificado);

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" />Problemas</CardTitle>
          <CardDescription>Llamadas, soporte y pedidos no entregados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {problemas.length === 0 && noEntregados.length === 0 ? (
            <p className="text-muted-foreground">No hay problemas abiertos</p>
          ) : null}
          {problemas.map((row) => (
            <div key={row.id} className="flex items-start justify-between gap-3 rounded-md bg-muted px-3 py-2">
              <button type="button" className="text-left" onClick={() => { if (row.repartidor?.id) onAbrir(row.repartidor.id); }}>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{row.tipo === "llamada_cliente" ? "Llamada" : "Soporte"}</span>
                <span className="mt-1 block font-semibold">{row.repartidor?.nombre_completo || "Sin repartidor"} · {row.numero_pedido || "Sin pedido"}</span>
                <span className="mt-1 block text-muted-foreground">{row.motivo || "Sin motivo"}</span>
              </button>
              {row.pedido_id ? <Button variant="outline" size="sm" onClick={() => { setPedidoId(row.pedido_id); setFecha(fechaMexico(1)); }}>Reagendar</Button> : null}
            </div>
          ))}
          {noEntregados.map((row) => (
            <div key={row.id} data-aviso="1" className="flex items-start justify-between gap-3 rounded-md bg-red-50 px-3 py-2">
              <button type="button" className="text-left" onClick={() => { if (row.repartidor?.id) onAbrir(row.repartidor.id); }}>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">No entregado</span>
                </span>
                <span className="mt-1 block font-semibold">{row.numero_pedido} · {row.cliente || "Sin cliente"}</span>
                <span className="mt-1 block text-muted-foreground">{row.repartidor?.nombre_completo || "Sin repartidor"}{row.notas ? ` · ${row.notas}` : ""}</span>
              </button>
              <Button variant="outline" size="sm" onClick={() => { setPedidoId(row.id); setFecha(fechaMexico(1)); }}>Reagendar</Button>
            </div>
          ))}
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
          <CardDescription>El pedido sale de la ruta de hoy y queda para el día siguiente</CardDescription>
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

      <ContactosIncidencia onError={onError} />
    </div>
  );
}

function iniciales(nombre: string) {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase() || "").join("");
}

function ContactosIncidencia({ onError }: { onError: (error: unknown) => void }) {
  const yo = Number(authService.getUserData()?.id) || null;
  const [personas, setPersonas] = useState<{ id: number; nombre: string; telefono: string; repartidor_ids: number[] }[]>([]);
  const [repartidores, setRepartidores] = useState<{ id: number; nombre: string }[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "asignados" | "sin">("todos");
  const [picker, setPicker] = useState("");

  useEffect(() => {
    let vivo = true;
    callCenterService.listContactos().then((data) => {
      if (!vivo) return;
      setPersonas(data.personas);
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
  const mia = personas.find((persona) => persona.id === yo);
  const sugeridos = repartidores.filter((repartidor) => {
    if (!mia || mia.repartidor_ids.includes(repartidor.id)) return false;
    if (picker.trim() && !repartidor.nombre.toLowerCase().includes(picker.trim().toLowerCase())) return false;
    return true;
  }).slice(0, 8);

  const guardar = async () => {
    if (!mia) return;
    setGuardando(true);
    try {
      await callCenterService.guardarContacto(mia.id, mia.telefono, mia.repartidor_ids);
      setListo(true);
    } catch (error) {
      onError(error);
    } finally {
      setGuardando(false);
    }
  };

  const quitar = (repartidorId: number) => {
    setListo(false);
    setPersonas((lista) => lista.map((persona) => persona.id === yo
      ? { ...persona, repartidor_ids: persona.repartidor_ids.filter((id) => id !== repartidorId) }
      : persona));
  };

  const agregar = (repartidorId: number) => {
    setListo(false);
    setPicker("");
    setPersonas((lista) => lista.map((persona) => {
      if (persona.id === yo) return { ...persona, repartidor_ids: [...persona.repartidor_ids, repartidorId] };
      return { ...persona, repartidor_ids: persona.repartidor_ids.filter((id) => id !== repartidorId) };
    }));
  };

  return (
    <section className="space-y-4 rounded-xl bg-muted/40 p-4" data-ui>
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Users className="h-5 w-5 text-primary" />Contactos de Soporte y Asignación</h2>
        <p className="mt-1">Asigna repartidores a cada agente de Call Center. Un repartidor solo puede tener un agente asignado a la vez.</p>
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
          {visibles.map((persona, index) => {
            const propio = persona.id === yo;
            return (
              <div key={persona.id} className={`space-y-3 rounded-xl p-4 ${index % 2 === 0 ? "bg-white" : "bg-pink-50"}`}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{iniciales(persona.nombre)}</span>
                  <div>
                    <p className="text-lg font-semibold">{persona.nombre}</p>
                    <p className="text-sm text-muted-foreground">{propio ? "Tu contacto" : "Solo lectura"}</p>
                  </div>
                </div>
                <label className="block" htmlFor={`tel-${persona.id}`}>Teléfono de contacto directo</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={`tel-${persona.id}`}
                    value={persona.telefono}
                    readOnly={!propio}
                    className="pl-9"
                    onChange={(event) => {
                      setListo(false);
                      setPersonas((lista) => lista.map((row) => row.id === persona.id ? { ...row, telefono: event.target.value } : row));
                    }}
                  />
                </div>
                <p>Repartidores asignados · {persona.repartidor_ids.length}</p>
                <div className="flex flex-wrap gap-2">
                  {persona.repartidor_ids.length === 0 ? <p className="text-sm text-muted-foreground">Ningún repartidor</p> : persona.repartidor_ids.map((id) => (
                    <span key={id} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      {repartidores.find((row) => row.id === id)?.nombre || `Repartidor ${id}`}
                      {propio ? <button type="button" aria-label={`Quitar ${repartidores.find((row) => row.id === id)?.nombre || id}`} onClick={() => quitar(id)}>×</button> : null}
                    </span>
                  ))}
                </div>
                {propio ? (
                  <>
                    <Input aria-label="Buscar repartidor" value={picker} placeholder="Buscar y asignar repartidor" onChange={(event) => setPicker(event.target.value)} />
                    {picker.trim() ? sugeridos.map((repartidor) => (
                      <button key={repartidor.id} type="button" className="block w-full bg-background px-3 py-2 text-left" onClick={() => agregar(repartidor.id)}>
                        {repartidor.nombre}{ocupados.has(repartidor.id) ? " · pasa a tu lista" : ""}
                      </button>
                    )) : null}
                    <Button disabled={guardando || persona.telefono.trim().length < 8} onClick={() => void guardar()}>
                      {guardando ? "Guardando…" : "Guardar contacto"}
                    </Button>
                    {listo ? <p>Contacto guardado. La app usará este número.</p> : null}
                  </>
                ) : <p>Solo esa persona puede cambiar su número y sus repartidores.</p>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
