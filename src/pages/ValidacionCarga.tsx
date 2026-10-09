import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  callCenterService,
  type CargaLinea,
  type InventarioHit,
  type Solicitud,
} from "@/services/callCenterService";

type ExtraDraft = {
  key: string;
  fkid_producto: number;
  nombre: string;
  cantidad: number;
  precio: string;
};

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la solicitud";
}

function formatMoney(value: number) {
  return value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineTotal(cantidad: number, precio: number) {
  return cantidad * precio;
}

function draftsFrom(cargas: CargaLinea[] | undefined): ExtraDraft[] {
  return (cargas || [])
    .filter((linea) => linea.es_extra && linea.fkid_producto)
    .map((linea, index) => ({
      key: `saved-${linea.id ?? index}-${linea.fkid_producto}`,
      fkid_producto: Number(linea.fkid_producto),
      nombre: linea.nombre,
      cantidad: Number(linea.cantidad) || 1,
      precio: String(linea.precio_unitario ?? 0),
    }));
}

const ValidacionCarga = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const solicitudId = Number(id);
  const keyRef = useRef(0);
  const searchRequest = useRef(0);
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<InventarioHit[]>([]);
  const [picked, setPicked] = useState<InventarioHit | null>(null);
  const [cantidad, setCantidad] = useState("1");
  const [precio, setPrecio] = useState("0");

  useEffect(() => {
    if (!Number.isFinite(solicitudId)) {
      setError("La validación no existe");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const next = await callCenterService.getSolicitud(solicitudId);
        if (cancelled) return;
        if (next.tipo !== "check_in") {
          setError("Esta solicitud no es un check-in");
          return;
        }
        setSolicitud(next);
        setExtras(draftsFrom(next.cargas));
      } catch (err) {
        if (!cancelled) setError(errorText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [solicitudId]);

  useEffect(() => {
    if (!modalOpen) return;
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    const requestId = ++searchRequest.current;
    const timer = setTimeout(() => {
      void callCenterService.buscarInventario(term).then((rows) => {
        if (requestId === searchRequest.current) setHits(rows);
      }).catch(() => {
        if (requestId === searchRequest.current) setHits([]);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, modalOpen]);

  const pedidos = (solicitud?.cargas || []).filter((linea) => !linea.es_extra);
  const dinero = Number(solicitud?.dinero_esperado) || 0;

  const notify = (err: unknown) => {
    toast({ title: "Validación de carga", description: errorText(err), variant: "destructive" });
  };

  const payloadExtras = () => extras.map((linea) => {
    const amount = Number(linea.precio);
    if (!Number.isInteger(linea.cantidad) || linea.cantidad < 1 || !Number.isFinite(amount) || amount < 0) {
      throw new Error("Revisa la cantidad y el precio de la carga extra");
    }
    return {
      fkid_producto: linea.fkid_producto,
      cantidad: linea.cantidad,
      precio_unitario: amount,
    };
  });

  const guardar = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await callCenterService.guardarExtras(solicitudId, payloadExtras());
      toast({ title: "Carga extra guardada" });
    } catch (err) {
      notify(err);
    } finally {
      setBusy(false);
    }
  };

  const aprobar = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await callCenterService.guardarExtras(solicitudId, payloadExtras());
      await callCenterService.aprobar(solicitudId);
      toast({ title: "Check-in aprobado" });
      navigate("/dashboard/call-center");
    } catch (err) {
      notify(err);
    } finally {
      setBusy(false);
    }
  };

  const openModal = () => {
    setQuery("");
    setHits([]);
    setPicked(null);
    setCantidad("1");
    setPrecio("0");
    setModalOpen(true);
  };

  const chooseHit = (hit: InventarioHit) => {
    setPicked(hit);
    setPrecio(String(hit.precio_venta ?? 0));
  };

  const addExtra = () => {
    if (!picked) return;
    const qty = Number(cantidad);
    const amount = Number(precio);
    if (!Number.isInteger(qty) || qty < 1 || !Number.isFinite(amount) || amount < 0) {
      notify(new Error("Revisa la cantidad y el precio de la carga extra"));
      return;
    }
    setExtras((list) => {
      const current = list.find((linea) => linea.fkid_producto === picked.id);
      if (current) {
        return list.map((linea) => linea.fkid_producto === picked.id
          ? { ...linea, cantidad: qty, precio: String(amount), nombre: picked.nombre }
          : linea);
      }
      keyRef.current += 1;
      return [...list, {
        key: `new-${keyRef.current}`,
        fkid_producto: picked.id,
        nombre: picked.nombre,
        cantidad: qty,
        precio: String(amount),
      }];
    });
    setModalOpen(false);
  };

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <p>{error}</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/call-center")}>Volver a Call Center</Button>
      </div>
    );
  }

  if (!solicitud) {
    return <div className="p-6">Cargando validación…</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Validación de carga</h1>
          <p className="text-sm text-muted-foreground">
            {solicitud.repartidor?.nombre_completo || "Repartidor"} · Dinero esperado ${formatMoney(dinero)} · En espera de aprobación
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/call-center")}>Volver</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Carga de pedidos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.length === 0 ? (
                <TableRow><TableCell colSpan={4}>No hay productos de pedidos</TableCell></TableRow>
              ) : pedidos.map((linea) => (
                <TableRow key={`${linea.fkid_producto ?? linea.nombre}`}>
                  <TableCell>{linea.nombre}</TableCell>
                  <TableCell>{linea.cantidad}</TableCell>
                  <TableCell>${formatMoney(Number(linea.precio_unitario) || 0)}</TableCell>
                  <TableCell>${formatMoney(lineTotal(Number(linea.cantidad) || 0, Number(linea.precio_unitario) || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Carga extra</CardTitle>
          <Button variant="outline" onClick={openModal}>Agregar extra</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extras.length === 0 ? (
                <TableRow><TableCell colSpan={5}>Sin producto extra</TableCell></TableRow>
              ) : extras.map((linea) => (
                <TableRow key={linea.key}>
                  <TableCell>{linea.nombre} · extra</TableCell>
                  <TableCell>
                    <Input
                      aria-label={`Cantidad de ${linea.nombre}`}
                      type="number"
                      min={1}
                      value={linea.cantidad}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        setExtras((list) => list.map((row) => row.key === linea.key ? { ...row, cantidad: next } : row));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`Precio de ${linea.nombre}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={linea.precio}
                      onChange={(event) => {
                        const next = event.target.value;
                        setExtras((list) => list.map((row) => row.key === linea.key ? { ...row, precio: next } : row));
                      }}
                    />
                  </TableCell>
                  <TableCell>${formatMoney(lineTotal(linea.cantidad, Number(linea.precio) || 0))}</TableCell>
                  <TableCell>
                    <Button variant="outline" onClick={() => setExtras((list) => list.filter((row) => row.key !== linea.key))}>Quitar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex gap-3">
            <Button variant="outline" disabled={busy} onClick={() => void guardar()}>Guardar extra</Button>
            <Button disabled={busy} onClick={() => void aprobar()}>Aprobar carga</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar producto extra</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              aria-label="Buscar producto"
              placeholder="Buscar en inventario"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <ul className="max-h-40 space-y-1 overflow-auto">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <Button
                    type="button"
                    variant={picked?.id === hit.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => chooseHit(hit)}
                  >
                    {hit.nombre} · ${formatMoney(Number(hit.precio_venta) || 0)}
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                aria-label="Cantidad extra"
                type="number"
                min={1}
                value={cantidad}
                onChange={(event) => setCantidad(event.target.value)}
              />
              <Input
                aria-label="Precio extra"
                type="number"
                min={0}
                step="0.01"
                value={precio}
                onChange={(event) => setPrecio(event.target.value)}
              />
            </div>
            <Button disabled={!picked} onClick={addExtra}>Agregar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ValidacionCarga;
