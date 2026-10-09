import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

type ValidacionCargaProps = {
  solicitudId?: number;
  embedded?: boolean;
  onBack?: () => void;
  onApproved?: () => void;
};

const ValidacionCarga = ({ solicitudId: solicitudIdProp, embedded = false, onBack, onApproved }: ValidacionCargaProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const solicitudId = solicitudIdProp ?? Number(id);
  const leave = () => {
    if (onBack) onBack();
    else navigate("/dashboard/call-center");
  };
  const keyRef = useRef(0);
  const searchRequest = useRef(0);
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<InventarioHit[]>([]);
  const [searching, setSearching] = useState(false);
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
      setSearching(false);
      return;
    }
    const requestId = ++searchRequest.current;
    setSearching(true);
    const timer = setTimeout(() => {
      void callCenterService.buscarInventario(term).then((rows) => {
        if (requestId !== searchRequest.current) return;
        setHits(rows);
        setSearching(false);
      }).catch(() => {
        if (requestId !== searchRequest.current) return;
        setHits([]);
        setSearching(false);
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
      if (onApproved) onApproved();
      else navigate("/dashboard/call-center?tab=validacion");
    } catch (err) {
      notify(err);
    } finally {
      setBusy(false);
    }
  };

  const openModal = () => {
    setQuery("");
    setHits([]);
    setSearching(false);
    setComboOpen(false);
    setPicked(null);
    setCantidad("1");
    setPrecio("0");
    setModalOpen(true);
  };

  const chooseHit = (hit: InventarioHit) => {
    setPicked(hit);
    setPrecio(String(hit.precio_venta ?? 0));
    setComboOpen(false);
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
        <Button variant="outline" onClick={leave}>Volver</Button>
      </div>
    );
  }

  if (!solicitud) {
    return <div className={embedded ? "" : "p-6"}>Cargando validación…</div>;
  }

  return (
    <div className={embedded ? "space-y-6" : "space-y-6 p-6"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Validación de carga</h1>
          <p className="text-sm text-muted-foreground">
            {solicitud.repartidor?.nombre_completo || "Repartidor"} · Dinero esperado ${formatMoney(dinero)} · En espera de aprobación
          </p>
        </div>
        <Button variant="outline" onClick={leave}>Volver</Button>
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
            <Popover modal open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  aria-label="Buscar producto"
                  className="w-full justify-between"
                >
                  {picked ? (
                    <span className="truncate">
                      {picked.nombre} · ${formatMoney(Number(picked.precio_venta) || 0)}
                    </span>
                  ) : (
                    <span className="font-normal text-muted-foreground">Buscar en inventario</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="z-[60] w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar en inventario"
                    value={query}
                    onValueChange={setQuery}
                  />
                  <CommandList>
                    {searching ? (
                      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buscando…
                      </div>
                    ) : query.trim().length < 2 ? (
                      <CommandEmpty>Escribe al menos 2 letras</CommandEmpty>
                    ) : hits.length === 0 ? (
                      <CommandEmpty>No se encontraron productos</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {hits.map((hit) => (
                          <CommandItem
                            key={hit.id}
                            value={String(hit.id)}
                            onSelect={() => chooseHit(hit)}
                          >
                            <Check className={cn("mr-2 h-4 w-4", picked?.id === hit.id ? "opacity-100" : "opacity-0")} />
                            <span className="truncate">{hit.nombre}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              ${formatMoney(Number(hit.precio_venta) || 0)}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
