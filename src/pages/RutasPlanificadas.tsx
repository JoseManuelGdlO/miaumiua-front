import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, Calendar, Download, MapPin, Navigation, Pencil, Phone, Truck, UserRound } from "lucide-react";
import jsPDF from "jspdf";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { citiesService } from "@/services/citiesService";
import { driversService } from "@/services/driversService";
import { routesService, type Route, type RouteOrder } from "@/services/routesService";

function dinero(value: number) {
  return `$${Number(value || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fechaLarga(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function productosDe(stop: RouteOrder) {
  const lineas = [
    ...(stop.pedido?.productos || []).map((linea) => `${linea.producto?.nombre || "Producto"} x${linea.cantidad}`),
    ...(stop.pedido?.paquetes || []).map((linea) => `${linea.paquete?.nombre || "Paquete"} x${linea.cantidad}`),
  ];
  return lineas.join(" · ");
}

function claseEstadoRuta(estado?: string) {
  if (estado === "en_progreso") return "border-transparent bg-sky-100 text-sky-800";
  if (estado === "completada") return "border-transparent bg-emerald-100 text-emerald-800";
  if (estado === "cancelada") return "border-transparent bg-red-100 text-red-800";
  return "border-transparent bg-violet-100 text-violet-800";
}

function claseEstadoEntrega(estado?: string) {
  if (estado === "entregado") return "border-transparent bg-emerald-100 text-emerald-800";
  if (estado === "en_camino") return "border-transparent bg-sky-100 text-sky-800";
  if (estado === "fallido") return "border-transparent bg-red-100 text-red-800";
  return "border-transparent bg-amber-100 text-amber-800";
}

function estadoDe(stop: RouteOrder) {
  if (stop.estado_entrega === "entregado") return "Entregado";
  if (stop.estado_entrega === "en_camino") return "En camino";
  if (stop.estado_entrega === "fallido") return "Fallido";
  return "Pendiente";
}

function textoEstadoRuta(estado?: string) {
  if (estado === "en_progreso") return "En progreso";
  if (estado === "completada") return "Completada";
  if (estado === "cancelada") return "Cancelada";
  return "Planificada";
}

const RutasPlanificadas = () => {
  const { toast } = useToast();
  const [cities, setCities] = useState<{ id: number; nombre: string }[]>([]);
  const [cityId, setCityId] = useState("all");
  const [date, setDate] = useState("");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<{ id: number; nombre_completo: string; telefono?: string; tipo_vehiculo?: string }[]>([]);

  const load = async (city: string, day: string) => {
    // shortcut: muestra hasta 100 rutas, subir el límite si el listado se corta
    const params: { limit: number; fkid_ciudad?: number; fecha_ruta?: string } = { limit: 100 };
    if (city && city !== "all") params.fkid_ciudad = parseInt(city, 10);
    if (day) params.fecha_ruta = day;
    const [routesResponse, driversResponse] = await Promise.all([
      routesService.getAllRoutes(params),
      driversService.getAllDrivers(),
    ]);
    if (routesResponse.success) setRoutes(routesResponse.data.rutas || []);
    if (driversResponse.success) setDrivers(driversResponse.data.repartidores || []);
  };

  useEffect(() => {
    void citiesService.getAllCities().then((response) => {
      if (response.success) setCities(response.data.cities || []);
    }).catch(() => {
      toast({ title: "Rutas planificadas", description: "No se pudieron cargar las ciudades", variant: "destructive" });
    });
  }, []);

  useEffect(() => {
    void load(cityId, date).catch(() => {
      toast({ title: "Rutas planificadas", description: "No se pudieron cargar las rutas", variant: "destructive" });
    });
  }, [cityId, date]);

  const paradas = routes.reduce((sum, route) => sum + (route.pedidos?.length || 0), 0);
  const carga = routes.reduce((sum, route) => sum + (route.pedidos || []).reduce((inner, stop) => inner + Number(stop.pedido?.total || 0), 0), 0);

  const assignDriver = async (routeId: number, driverId: string) => {
    try {
      await routesService.updateRoute(routeId, { fkid_repartidor: parseInt(driverId, 10) });
      toast({ title: "Repartidor asignado" });
      await load(cityId, date);
    } catch (error) {
      toast({ title: "Rutas planificadas", description: error instanceof Error ? error.message : "No se pudo asignar", variant: "destructive" });
    }
  };

  const pdf = (route: Route) => {
    const doc = new jsPDF();
    let y = 16;
    doc.setFontSize(14);
    doc.text(route.nombre_ruta, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Repartidor: ${route.repartidor?.nombre_completo || "Sin asignar"}`, 14, y);
    (route.pedidos || []).forEach((stop, index) => {
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
      doc.text(`${stop.orden_entrega || index + 1}. ${stop.pedido?.numero_pedido || stop.fkid_pedido} · ${stop.pedido?.cliente?.nombre_completo || ""}`, 14, y);
      y += 5;
      doc.text(String(stop.pedido?.direccion_entrega || "").slice(0, 90), 14, y);
    });
    doc.save(`Ruta_${route.id}.pdf`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rutas planificadas</h1>
        <p className="text-sm text-muted-foreground">Las rutas que ya se crearon. Aquí no se crean rutas nuevas.</p>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Ciudad</Label>
          <Select value={cityId} onValueChange={setCityId}>
            <SelectTrigger><SelectValue placeholder="Todas las ciudades" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {cities.map((city) => <SelectItem key={city.id} value={String(city.id)}>{city.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fecha de entrega</Label>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Rutas en preparación" value={routes.length} icon={Navigation} tone="primary" />
        <StatCard title="Paradas" value={paradas} icon={MapPin} tone="info" />
        <StatCard title="Repartidores" value={drivers.length} icon={UserRound} tone="success" />
        <StatCard title="Carga monetaria" value={dinero(carga)} icon={Banknote} tone="warning" />
      </div>

      {routes.length === 0 ? (
        <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Todavía no hay rutas creadas.</p>
      ) : routes.map((route, index) => {
        const suma = (route.pedidos || []).reduce((sum, stop) => sum + Number(stop.pedido?.total || 0), 0);
        const paradasRuta = route.pedidos || [];
        return (
          <section key={route.id} className={`space-y-4 rounded-xl border p-4 ${index % 2 === 0 ? "bg-card" : "bg-primary/5"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{route.nombre_ruta}</h2>
                  <Badge className={claseEstadoRuta(route.estado)}>{textoEstadoRuta(route.estado)}</Badge>
                  <span className="text-sm text-muted-foreground">{paradasRuta.length} pedidos</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm capitalize text-muted-foreground"><Calendar className="h-4 w-4" /> {fechaLarga(route.fecha_ruta)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {route.repartidor ? (
                  <div className="rounded-lg border px-3 py-2 text-sm">
                    <p className="flex items-center gap-1 font-medium"><UserRound className="h-4 w-4 text-primary" /> {route.repartidor.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground">{route.repartidor.tipo_vehiculo || "Vehículo"}{route.repartidor.telefono ? ` · ${route.repartidor.telefono}` : ""}</p>
                  </div>
                ) : (
                  <Select onValueChange={(value) => void assignDriver(route.id, value)}>
                    <SelectTrigger className="w-56"><SelectValue placeholder="Elige un repartidor" /></SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => <SelectItem key={driver.id} value={String(driver.id)}>{driver.nombre_completo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" onClick={() => pdf(route)}><Download className="h-4 w-4" /> PDF</Button>
              </div>
            </div>

            <div className="space-y-2">
              {paradasRuta
                .slice()
                .sort((a, b) => (a.orden_entrega || 0) - (b.orden_entrega || 0))
                .map((stop, index) => (
                  <article key={stop.id} className="flex gap-3 rounded-lg border p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{stop.orden_entrega || index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{stop.pedido?.cliente?.nombre_completo || "Cliente"} <span className="font-normal text-muted-foreground">{stop.pedido?.numero_pedido}</span></p>
                          {stop.pedido?.cliente?.telefono ? <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {stop.pedido.cliente.telefono}</p> : null}
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /> {stop.pedido?.direccion_entrega || "Sin dirección"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{dinero(Number(stop.pedido?.total || 0))}</p>
                          <Badge className={`mt-1 ${claseEstadoEntrega(stop.estado_entrega)}`}>{estadoDe(stop)}</Badge>
                        </div>
                      </div>
                      {productosDe(stop) ? <p className="mt-2 text-xs text-muted-foreground">{productosDe(stop)}</p> : null}
                      {stop.notas_entrega ? <p className="mt-1 text-xs text-muted-foreground">Notas: {stop.notas_entrega}</p> : null}
                    </div>
                  </article>
                ))}
            </div>

            {(route.pedidos || []).some((stop) => !stop.estado_entrega || stop.estado_entrega === "pendiente" || stop.estado_entrega === "en_camino" || stop.estado_entrega === "fallido") ? (
              <Button asChild className="w-full">
                <Link to={`/dashboard/routes?ciudad=${route.fkid_ciudad}&fecha=${String(route.fecha_ruta).slice(0, 10)}&ruta=${route.id}`}><Pencil className="h-4 w-4" /> Modificar ruta</Link>
              </Button>
            ) : null}
            <div className="flex flex-wrap gap-4 border-t pt-3 text-sm text-muted-foreground">
              <span>{paradasRuta.length} entregas</span>
              <span className="font-medium text-foreground">Suma {dinero(suma)}</span>
              {route.tiempo_estimado ? <span className="flex items-center gap-1"><Truck className="h-4 w-4" /> {Math.round(Number(route.tiempo_estimado))} min</span> : null}
            </div>
          </section>
        );
      })}

    </div>
  );
};

export default RutasPlanificadas;
