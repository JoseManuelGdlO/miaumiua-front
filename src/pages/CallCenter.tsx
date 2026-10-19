import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  type Solicitud,
} from "@/services/callCenterService";
import { canReassign, keepSelection, shouldRefreshAfter, statusLabel, statusOptions } from "@/lib/call-center-rules.mjs";
import { config } from "@/config/environment";

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
  return error instanceof Error ? error.message : "No se pudo completar la solicitud";
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

const CallCenter = () => {
  const { toast } = useToast();
  const stream = useNotificationStream();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "validacion" || tabParam === "incidencias" ? tabParam : "operacion";
  const solicitudParam = Number(searchParams.get("solicitud"));
  const cargaId = Number.isFinite(solicitudParam) && solicitudParam > 0 ? solicitudParam : null;
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [pedidos, setPedidos] = useState<PedidoDia[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [ciudadId, setCiudadId] = useState<string>("all");
  const [repartidorId, setRepartidorId] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Solicitud | null>(null);
  const [nota, setNota] = useState("");
  const [busy, setBusy] = useState(false);
  const [reassignFor, setReassignFor] = useState<PedidoDia | null>(null);
  const [drivers, setDrivers] = useState<RepartidorOpcion[]>([]);
  const [targetDriver, setTargetDriver] = useState<string>("");
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  const [estadoBusyIds, setEstadoBusyIds] = useState<number[]>([]);
  const [historial, setHistorial] = useState<CargaValidada[]>([]);
  const [historialId, setHistorialId] = useState<number | null>(null);
  const [historialTick, setHistorialTick] = useState(0);
  const [receipt, setReceipt] = useState<{ url: string; numero: string } | null>(null);
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
      const [nextSolicitudes, nextPedidos] = await Promise.all([
        callCenterService.listSolicitudes(),
        callCenterService.listPedidos(filters),
      ]);
      if (!stillCurrent()) return;
      setSolicitudes(nextSolicitudes);
      setPedidos(nextPedidos);
      setSelectedId((current) => keepSelection(current));
    } catch (error) {
      if (!stillCurrent()) return;
      throw error;
    }
  }, [ciudadId, repartidorId]);

  const openValidacion = (id: number) => {
    setSearchParams({ tab: "validacion", solicitud: String(id) });
  };

  const closeValidacion = () => {
    setSearchParams({ tab: "validacion" });
  };

  const onTab = (value: string) => {
    if (value === "validacion" || value === "incidencias") setSearchParams({ tab: value });
    else setSearchParams({});
  };

  useEffect(() => {
    void citiesService.getActiveCities().then((response) => setCities(response.data.cities)).catch(notify);
  }, []);

  useEffect(() => {
    if (tab !== "validacion") return;
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
    const run = async () => {
      try {
        await loadLists();
      } catch (error) {
        if (!stop) notify(error);
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

  const liberar = async () => {
    if (!detail || busy) return;
    setBusy(true);
    try {
      const result = await callCenterService.liberarCierre(detail.id);
      toast({ title: "Día liberado", description: result.cerrado_por_nombre || undefined });
      dismissDetail();
      await afterAction();
    } catch (error) {
      await afterAction(error);
    } finally {
      setBusy(false);
    }
  };

  const atender = async () => {
    if (!detail || busy) return;
    setBusy(true);
    try {
      await callCenterService.atender(detail.id, nota.trim() || undefined);
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
  };

  const openCambios = async (pedido: PedidoDia) => {
    const requestId = ++reassignRequest.current;
    reassignPedidoId.current = pedido.id;
    setReassignFor(pedido);
    setDrivers([]);
    setTargetDriver("");
    setNuevoEstado("");
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
  const historialAbierto = historial.find((row) => row.id === historialId) || null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Call Center</h1>
        <p className="text-muted-foreground">
          Solicitudes, pedidos del día y validación de carga
        </p>
      </div>
      <Tabs value={tab} onValueChange={onTab}>
        <TabsList>
          <TabsTrigger value="operacion">Operación</TabsTrigger>
          <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
          <TabsTrigger value="validacion">Validación de carga</TabsTrigger>
        </TabsList>
        <TabsContent value="operacion" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cola</CardTitle>
          <CardDescription>Solicitudes que esperan atención</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Repartidor</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Pedido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitudes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No hay solicitudes en la cola
                  </TableCell>
                </TableRow>
              ) : solicitudes.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => {
                    if (row.tipo === "check_in") {
                      openValidacion(row.id);
                      return;
                    }
                    void openSolicitud(row.id);
                  }}
                  className="cursor-pointer"
                >
                  <TableCell>{TIPO[row.tipo] || row.tipo}</TableCell>
                  <TableCell>{row.repartidor?.nombre_completo || "—"}</TableCell>
                  <TableCell>{row.hora}</TableCell>
                  <TableCell>{row.numero_pedido || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos del día</CardTitle>
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
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No hay pedidos para los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : pedidos.map((row) => (
                <TableRow key={row.ruta_pedido_id}>
                  <TableCell>{row.numero_pedido}</TableCell>
                  <TableCell>{row.cliente || "—"}</TableCell>
                  <TableCell>{row.telefono ? <a href={`tel:${row.telefono}`}>{row.telefono}</a> : "—"}</TableCell>
                  <TableCell>{row.direccion || "—"}</TableCell>
                  <TableCell><OrderStatus estado={row.estado} modificado={row.modificado} /></TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button variant={row.franja === "tarde" ? "outline" : "default"} size="sm" onClick={() => void cambiarFranja(row.id, "manana")}>Mañana</Button>
                      <Button variant={row.franja === "tarde" ? "default" : "outline"} size="sm" onClick={() => void cambiarFranja(row.id, "tarde")}>Tarde</Button>
                      <Button variant="ghost" size="sm" onClick={() => void cambiarFranja(row.id, row.franja === "tarde" ? "tarde" : "manana", "ruta")}>Aplicar a la ruta</Button>
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
                  <TableCell className="text-right">
                    <div className="mb-2 flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => void moverParada(row.id, "subir")}>Subir</Button>
                      <Button variant="outline" size="sm" onClick={() => void moverParada(row.id, "bajar")}>Bajar</Button>
                    </div>
                    {statusOptions(row.estado).length > 0 || canReassign(row.estado) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={estadoBusyIds.includes(row.id)}
                        onClick={() => void openCambios(row)}
                      >
                        Cambiar
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

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

      <Dialog open={detail != null} onOpenChange={(open) => { if (!open) dismissDetail(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detail ? TIPO[detail.tipo] : ""}</DialogTitle></DialogHeader>
          {detail && detail.tipo === "cierre_dia" && (
            <div className="space-y-3">
              <p>{detail.repartidor?.nombre_completo || "Repartidor"}</p>
              <p>El repartidor ya subió la foto del depósito.</p>
              <Button disabled={busy} onClick={() => void liberar()}>Liberar cierre</Button>
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
              <Textarea value={nota} onChange={(event) => setNota(event.target.value)} placeholder="Nota opcional" />
              <Button disabled={busy} onClick={() => void atender()}>Atendido</Button>
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
        <TabsContent value="incidencias">
          <IncidenciasPanel
            pedidos={pedidos}
            solicitudes={solicitudes}
            onChanged={() => { void loadLists().catch(notify); }}
            onError={notify}
          />
        </TabsContent>
        <TabsContent value="validacion" className="space-y-6">
          {cargaId ? (
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Por validar</CardTitle>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                          No hay cargas esperando validación
                        </TableCell>
                      </TableRow>
                    ) : pendientes.map((row) => (
                      <TableRow key={row.id} onClick={() => openValidacion(row.id)} className="cursor-pointer">
                        <TableCell>{row.repartidor?.nombre_completo || "—"}</TableCell>
                        <TableCell>{row.fecha}</TableCell>
                        <TableCell>{row.hora}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
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
                  ) : historial.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={() => setHistorialId((current) => current === row.id ? null : row.id)}
                      className="cursor-pointer"
                    >
                      <TableCell>{row.repartidor?.nombre_completo || "—"}</TableCell>
                      <TableCell>{row.fecha}</TableCell>
                      <TableCell>{row.hora}</TableCell>
                      <TableCell>${formatMoney(Number(row.dinero_esperado) || 0)}</TableCell>
                      <TableCell>{row.validado_por_nombre || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              {historialAbierto && (
                <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(historialAbierto.cargas || []).map((linea) => (
                      <TableRow key={`${linea.fkid_producto ?? linea.nombre}-${linea.es_extra}`}>
                        <TableCell>{linea.nombre}</TableCell>
                        <TableCell>{linea.cantidad}</TableCell>
                        <TableCell>${formatMoney(Number(linea.precio_unitario) || 0)}</TableCell>
                        <TableCell>{linea.es_extra ? "extra" : ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CallCenter;
