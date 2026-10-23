import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AvailableOrder } from "@/services/routesService";

function dinero(value: number) {
  return `$${Number(value || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type AgregarPedidosRutaProps = {
  open: boolean;
  rutaNombre: string;
  ciudad: string;
  orders: AvailableOrder[];
  rutas?: { id: number; nombre: string }[];
  rutaId?: number;
  onRuta?: (id: number) => void;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (ids: number[]) => void;
};

export function AgregarPedidosRuta({ open, rutaNombre, ciudad, orders, rutas, rutaId, onRuta, busy, onOpenChange, onConfirm }: AgregarPedidosRutaProps) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const visibles = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => {
      const texto = `${order.numero_pedido || ""} ${order.cliente?.nombre_completo || ""} ${order.direccion_entrega || ""}`.toLowerCase();
      return texto.includes(term);
    });
  }, [orders, query]);
  const total = orders.filter((order) => picked.includes(order.id)).reduce((sum, order) => sum + Number(order.total || 0), 0);

  const toggle = (id: number) => {
    setPicked((list) => list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) {
        setPicked([]);
        setQuery("");
      }
      onOpenChange(next);
    }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar pedidos a la ruta</DialogTitle>
        </DialogHeader>
        {(rutas || []).length > 1 && onRuta ? (
          <Select value={rutaId ? String(rutaId) : undefined} onValueChange={(value) => onRuta(Number(value))}>
            <SelectTrigger><SelectValue placeholder="Elige la ruta" /></SelectTrigger>
            <SelectContent>
              {rutas!.map((ruta) => <SelectItem key={ruta.id} value={String(ruta.id)}>{ruta.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : null}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Filtrar por ID, cliente o colonia..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pedidos disponibles{ciudad ? ` en ${ciudad}` : ""} ({visibles.length})</span>
          <button type="button" className="font-medium text-primary" onClick={() => setPicked(visibles.map((order) => order.id))}>Seleccionar todos</button>
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {visibles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay pedidos para agregar</p>
          ) : visibles.map((order) => {
            const on = picked.includes(order.id);
            return (
              <div
                key={order.id}
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(order.id)}
                className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left ${on ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <Checkbox checked={on} className="mt-1 pointer-events-none" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{order.numero_pedido || `PED-${order.id}`} · {order.cliente?.nombre_completo || "Cliente"}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{order.direccion_entrega || "Sin dirección"}</span>
                  </span>
                </span>
                <span className="text-sm font-semibold text-primary">{dinero(Number(order.total || 0))}</span>
              </div>
            );
          })}
        </div>
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Los pedidos seleccionados se añaden de inmediato a {rutaNombre || "la ruta"}.
        </p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{picked.length} pedido{picked.length === 1 ? "" : "s"} seleccionado{picked.length === 1 ? "" : "s"} ({dinero(total)})</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button disabled={picked.length === 0 || busy} onClick={() => onConfirm(picked)}>Asignar a la ruta</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
