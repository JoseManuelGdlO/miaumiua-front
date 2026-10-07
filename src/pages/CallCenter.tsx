import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { citiesService, type City } from "@/services/citiesService";
import {
  callCenterService,
  type PedidoDia,
  type RepartidorOpcion,
  type Solicitud,
} from "@/services/callCenterService";
import { keepSelection, shouldRefreshAfter, statusOptions } from "@/lib/call-center-rules.mjs";

const TIPO: Record<string, string> = {
  check_in: "Check-in",
  llamada_cliente: "Llamada al cliente",
  soporte: "Soporte",
};

function errorStatus(error: unknown) {
  return typeof error === "object" && error && "status" in error ? Number((error as { status: number }).status) : 0;
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la solicitud";
}

const CallCenter = () => {
  const { toast } = useToast();
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
  const [estadoBusyIds, setEstadoBusyIds] = useState<number[]>([]);
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

  useEffect(() => {
    void citiesService.getActiveCities().then((response) => setCities(response.data.cities)).catch(notify);
  }, []);

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
    return () => {
      stop = true;
      listGeneration.current += 1;
      clearInterval(timer);
    };
  }, [loadLists]);

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

  const aprobar = async () => {
    if (!detail || busy) return;
    setBusy(true);
    try {
      await callCenterService.aprobar(detail.id);
      toast({ title: "Check-in aprobado" });
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

  const cambiarEstado = async (pedido: PedidoDia, estado: string) => {
    if (estadoPending.current.has(pedido.id)) return;
    estadoPending.current.add(pedido.id);
    setEstadoBusyIds([...estadoPending.current]);
    try {
      await callCenterService.cambiarEstado(pedido.id, estado);
      await loadLists();
    } catch (error) {
      await afterAction(error);
    } finally {
      estadoPending.current.delete(pedido.id);
      setEstadoBusyIds([...estadoPending.current]);
    }
  };

  const closeReassign = () => {
    reassignRequest.current += 1;
    reassignPedidoId.current = null;
    setReassignFor(null);
  };

  const openReassign = async (pedido: PedidoDia) => {
    if (!pedido.ciudad_id) {
      toast({ title: "Ese pedido no tiene ciudad", variant: "destructive" });
      return;
    }
    const requestId = ++reassignRequest.current;
    reassignPedidoId.current = pedido.id;
    setReassignFor(pedido);
    setDrivers([]);
    setTargetDriver("");
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

  const driverOptions = Array.from(
    new Map(pedidos.filter((row) => row.repartidor).map((row) => [row.repartidor!.id, row.repartidor!])).values()
  );

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader><CardTitle>Cola</CardTitle></CardHeader>
        <CardContent>
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
              {solicitudes.map((row) => (
                <TableRow key={row.id} onClick={() => void openSolicitud(row.id)} className="cursor-pointer">
                  <TableCell>{TIPO[row.tipo] || row.tipo}</TableCell>
                  <TableCell>{row.repartidor?.nombre_completo || "—"}</TableCell>
                  <TableCell>{row.hora}</TableCell>
                  <TableCell>{row.numero_pedido || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pedidos del día</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Repartidor</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((row) => (
                <TableRow key={row.ruta_pedido_id}>
                  <TableCell>{row.numero_pedido}</TableCell>
                  <TableCell>{row.cliente || "—"}</TableCell>
                  <TableCell>{row.telefono ? <a href={`tel:${row.telefono}`}>{row.telefono}</a> : "—"}</TableCell>
                  <TableCell>{row.direccion || "—"}</TableCell>
                  <TableCell><Badge>{row.estado}</Badge></TableCell>
                  <TableCell>{row.repartidor?.nombre_completo || "—"}</TableCell>
                  <TableCell className="space-x-2">
                    {statusOptions(row.estado).map((estado) => (
                      <Button key={estado} variant="outline" size="sm" disabled={estadoBusyIds.includes(row.id)} onClick={() => void cambiarEstado(row, estado)}>{estado}</Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => void openReassign(row)}>Reasignar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detail != null} onOpenChange={(open) => { if (!open) dismissDetail(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detail ? TIPO[detail.tipo] : ""}</DialogTitle></DialogHeader>
          {detail?.tipo === "check_in" && (
            <div className="space-y-3">
              <p>{detail.repartidor?.nombre_completo}</p>
              <ul>
                {detail.cargas?.map((linea) => (
                  <li key={`${linea.nombre}-${linea.es_extra}`}>{linea.nombre} × {linea.cantidad} · {linea.precio_unitario}{linea.es_extra ? " · extra" : ""}</li>
                ))}
              </ul>
              <Button disabled={busy} onClick={() => void aprobar()}>Aprobar</Button>
            </div>
          )}
          {detail && detail.tipo !== "check_in" && (
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
          <DialogHeader><DialogTitle>Reasignar pedido</DialogTitle></DialogHeader>
          <Select value={targetDriver} onValueChange={setTargetDriver}>
            <SelectTrigger><SelectValue placeholder="Repartidor" /></SelectTrigger>
            <SelectContent>
              {drivers.filter((driver) => driver.id !== reassignFor?.repartidor?.id).map((driver) => (
                <SelectItem key={driver.id} value={String(driver.id)}>{driver.nombre_completo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={busy || !targetDriver} onClick={() => void confirmReassign()}>Mover</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallCenter;
