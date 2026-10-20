import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { callCenterService, type PedidoDia, type Solicitud } from "@/services/callCenterService";

type Props = {
  pedidos: PedidoDia[];
  solicitudes: Solicitud[];
  onChanged: () => void;
  onError: (error: unknown) => void;
};

export default function IncidenciasPanel({ pedidos, solicitudes, onChanged, onError }: Props) {
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
          <CardTitle>Problemas</CardTitle>
          <CardDescription>Llamadas, soporte y pedidos no entregados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {problemas.length === 0 && noEntregados.length === 0 ? (
            <p className="text-muted-foreground">No hay problemas abiertos</p>
          ) : null}
          {problemas.map((row) => (
            <button key={row.id} type="button" onClick={() => row.pedido_id && setPedidoId(row.pedido_id)} className="block w-full rounded-md border px-3 py-2 text-left">
              <b>{row.tipo === "llamada_cliente" ? "Llamada" : "Soporte"}</b> · {row.repartidor?.nombre_completo || "Sin repartidor"} · {row.numero_pedido || "Sin pedido"}
              <span className="mt-1 block text-muted-foreground">{row.motivo || "Sin motivo"}</span>
            </button>
          ))}
          {noEntregados.map((row) => (
            <button key={row.id} type="button" onClick={() => setPedidoId(row.id)} className="block w-full rounded-md border px-3 py-2 text-left">
              <b>No entregado</b> · {row.numero_pedido} · {row.cliente || "Sin cliente"}
              {row.notas ? <span className="mt-1 block text-muted-foreground">{row.notas}</span> : null}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos modificados</CardTitle>
          <CardDescription>Cantidades o forma de pago distintas a las originales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {modificados.length === 0 ? <p className="text-muted-foreground">Ningún pedido fue modificado</p> : null}
          {modificados.map((row) => (
            <button key={row.id} type="button" onClick={() => setPedidoId(row.id)} className="block w-full rounded-md border px-3 py-2 text-left">
              <b>{row.numero_pedido}</b> · {row.cliente || "Sin cliente"} · {row.repartidor?.nombre_completo || "Sin repartidor"}
              {row.notas ? <span className="mt-1 block text-muted-foreground">{row.notas}</span> : null}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reagendar</CardTitle>
          <CardDescription>Saca el pedido de la ruta de hoy y deja la nueva fecha</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{pedidoId == null ? "Elige un pedido de las listas." : `Pedido #${pedidoId}`}</p>
          <Input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} aria-label="Nueva fecha" />
          <Textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Motivo" />
          <Button disabled={busy || pedidoId == null || !fecha || !motivo.trim()} onClick={() => void reagendar()}>Reagendar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
