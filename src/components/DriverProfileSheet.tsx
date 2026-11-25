import { useEffect, useState } from "react";
import { ChevronDown, Clock, Download, Edit, Loader2, MapPin, Package, Phone, Star, Truck } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ESTADOS_ADMIN, ESTADOS_LABEL } from "@/components/modals/DriverWizard";
import { config } from "@/config/environment";
import { useToast } from "@/hooks/use-toast";
import { driversService, Driver, DriverEstado } from "@/services/driversService";
import { canActivateDriver, canEdit } from "@/utils/permissions";

function fotoSrc(name?: string | null) {
  if (!name) return "";
  if (name.startsWith("http://") || name.startsWith("https://")) return name;
  if (name.startsWith("/")) return `${config.imageBaseUrl}${name}`;
  return `${config.imageBaseUrl}/uploads/repartidores/${name}`;
}

function ratingText(value: Driver["calificacion_promedio"]) {
  if (value === null || value === undefined || value === "") return "N/A";
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(1) : "N/A";
}

function fechaCorta(value?: string | null) {
  const dia = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return "Sin entregas";
  const [y, m, d] = dia.split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
}

function whatsappHref(telefono?: string) {
  const digits = String(telefono || "").replace(/\D/g, "");
  if (!digits) return "";
  const full = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${full}`;
}

const ESTADO_RUTA: Record<string, string> = {
  planificada: "Planificada",
  en_progreso: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

const ESTADO_PARADA: Record<string, string> = {
  pendiente: "Pendiente",
  en_camino: "En camino",
  entregado: "Entregado",
  fallido: "No entregado",
};

function turnoDe(franja?: string) {
  if (franja === "tarde") return "Tarde";
  if (franja === "manana") return "Mañana";
  return null;
}

type Doc = { key: string; title: string; hint: string; name?: string | null; extra?: string };

function docsDe(driver: Driver): Doc[] {
  return [
    { key: "poliza", title: "Póliza de seguro vehicular", hint: driver.seguro_vehiculo || "Póliza del auto", name: driver.poliza_seguro_archivo },
    { key: "licencia", title: "Licencia de conducir", hint: driver.licencia_conducir || "Foto de la licencia", name: driver.licencia_foto, extra: driver.licencia_vigencia ? `Vigencia ${fechaCorta(driver.licencia_vigencia)}` : undefined },
    { key: "ine", title: "Identificación oficial (INE)", hint: "Credencial para votar", name: driver.ine_archivo },
    { key: "consentimiento", title: "Comprobante de registro", hint: "Consentimiento de datos", name: driver.consentimiento_archivo, extra: driver.consentimiento_at ? `Firmado ${fechaCorta(driver.consentimiento_at)}` : undefined },
  ];
}

type Props = {
  driver: Driver | null;
  onClose: () => void;
  onEdit: (driver: Driver) => void;
  onChanged?: () => void;
};

export default function DriverProfileSheet({ driver, onClose, onEdit, onChanged }: Props) {
  const [detail, setDetail] = useState<Driver | null>(driver);
  const [loading, setLoading] = useState(false);
  const [busyEstado, setBusyEstado] = useState(false);
  const [rutaAbierta, setRutaAbierta] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!driver) {
      setDetail(null);
      return;
    }
    setDetail(driver);
    setRutaAbierta(null);
    let cancelled = false;
    setLoading(true);
    void driversService.getDriverById(driver.id)
      .then((response) => {
        if (!cancelled && response.success && response.data) setDetail(response.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [driver]);

  const cambiarEstado = async (estado: DriverEstado) => {
    if (!detail || detail.estado === estado) return;
    setBusyEstado(true);
    try {
      const response = await driversService.changeDriverStatus(detail.id, { estado });
      if (!response.success) throw new Error(response.message);
      setDetail({ ...detail, estado });
      onChanged?.();
      toast({ title: "Estado actualizado", description: `${detail.nombre_completo}: ${ESTADOS_LABEL[estado] || estado}` });
    } catch {
      toast({ title: "Error", description: "No se pudo cambiar el estado", variant: "destructive" });
    } finally {
      setBusyEstado(false);
    }
  };

  const row = detail;
  const docs = row ? docsDe(row) : [];
  const loaded = docs.filter((doc) => doc.name).length;
  const wa = whatsappHref(row?.telefono);

  return (
    <Sheet open={Boolean(driver)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {row ? (
          <>
            <SheetHeader className="space-y-4 border-b px-6 pb-5 pt-6 text-left">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <Badge variant="outline">{row.codigo_repartidor}</Badge>
                {canActivateDriver() ? (
                  <Select value={row.estado} onValueChange={(value) => void cambiarEstado(value as DriverEstado)} disabled={busyEstado}>
                    <SelectTrigger className="h-8 w-[11.5rem]" aria-label="Estado del repartidor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {row.estado && !ESTADOS_ADMIN.some((item) => item.value === row.estado) ? (
                        <SelectItem value={row.estado}>{ESTADOS_LABEL[row.estado] || row.estado}</SelectItem>
                      ) : null}
                      {ESTADOS_ADMIN.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={row.estado === "disponible" || row.estado === "activo" ? "default" : "secondary"}>
                    {ESTADOS_LABEL[row.estado] || row.estado}
                  </Badge>
                )}
                <Badge variant={row.es_prueba ? "secondary" : "outline"}>{row.es_prueba ? "Prueba" : "Oficial"}</Badge>
                {canEdit("drivers") ? (
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => onEdit(row)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                ) : null}
              </div>
              <div className="flex items-start gap-4">
                {fotoSrc(row.foto) ? (
                  <img src={fotoSrc(row.foto)} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {row.nombre_completo.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="text-xl">{row.nombre_completo}</SheetTitle>
                  <SheetDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-primary" />
                      {ratingText(row.calificacion_promedio)} / 5
                    </span>
                    <span className="inline-flex items-center gap-1 capitalize">
                      <Truck className="h-3.5 w-3.5" />
                      {row.tipo_vehiculo}
                      {row.capacidad_carga ? ` (${row.capacidad_carga} kg)` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {row.ciudad?.nombre || "Sin ciudad"}
                    </span>
                  </SheetDescription>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {row.telefono ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${row.telefono}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          {row.telefono}
                        </a>
                      </Button>
                    ) : null}
                    {wa ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="expediente" className="flex flex-1 flex-col">
              <TabsList className="mx-6 mt-4 grid h-auto w-auto grid-cols-3 bg-primary/10">
                <TabsTrigger value="expediente" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Expediente ({loaded})</TabsTrigger>
                <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Información</TabsTrigger>
                <TabsTrigger value="historial" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Historial</TabsTrigger>
              </TabsList>

              <TabsContent value="expediente" className="mt-0 space-y-4 px-6 py-4">
                <div className={`rounded-xl px-4 py-3 text-sm ${loaded === docs.length ? "bg-primary/10 text-foreground" : "bg-muted text-muted-foreground"}`}>
                  {loaded === docs.length
                    ? "Expediente completo: licencia, INE, póliza y consentimiento."
                    : `${loaded} de ${docs.length} documentos cargados.`}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {docs.map((doc) => {
                    const url = fotoSrc(doc.name);
                    return (
                      <div key={doc.key} className="flex flex-col rounded-xl bg-muted/60 p-4">
                        <p className="text-sm font-semibold">{doc.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{doc.hint}</p>
                        {doc.extra ? <p className="mt-1 text-xs">{doc.extra}</p> : null}
                        <p className="mt-2 truncate text-xs text-muted-foreground">{doc.name ? doc.name.split(/[/\\]/).pop() : "Sin archivo"}</p>
                        <div className="mt-3 flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" disabled={!url} asChild={Boolean(url)}>
                            {url ? <a href={url} target="_blank" rel="noreferrer">Ver</a> : <span>Ver</span>}
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" disabled={!url} asChild={Boolean(url)}>
                            {url ? (
                              <a href={url} download>
                                <Download className="mr-1 h-3.5 w-3.5" />
                                Descargar
                              </a>
                            ) : (
                              <span>Descargar</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="general" className="mt-0 space-y-3 px-6 py-4 text-sm">
                <p><span className="text-muted-foreground">Correo: </span>{row.email || "—"}</p>
                <p><span className="text-muted-foreground">Dirección: </span>{row.direccion || "—"}</p>
                <p><span className="text-muted-foreground">NSS: </span>{row.seguro_social || "—"}</p>
                <p><span className="text-muted-foreground">Tipo de sangre: </span>{row.tipo_sangre || "—"}</p>
                <p><span className="text-muted-foreground">Seguro del vehículo: </span>{row.seguro_vehiculo || "—"}</p>
                {row.notas ? <p><span className="text-muted-foreground">Notas: </span>{row.notas}</p> : null}
              </TabsContent>

              <TabsContent value="historial" className="mt-0 space-y-4 px-6 py-4 text-sm">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-amber-100 p-3 text-amber-950">
                    <p className="inline-flex items-center gap-1 text-xs">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      Calificación
                    </p>
                    <p className="mt-1 text-lg font-semibold">{ratingText(row.calificacion_promedio)}</p>
                  </div>
                  <div className="rounded-xl bg-sky-100 p-3 text-sky-950">
                    <p className="inline-flex items-center gap-1 text-xs">
                      <Package className="h-3.5 w-3.5" />
                      Pedidos
                    </p>
                    <p className="mt-1 text-lg font-semibold">{row.total_entregas || 0}</p>
                  </div>
                  <div className="rounded-xl bg-fuchsia-100 p-3 text-fuchsia-950">
                    <p className="inline-flex items-center gap-1 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      Última entrega
                    </p>
                    <p className="mt-1 text-lg font-semibold">{fechaCorta(row.fecha_ultima_entrega)}</p>
                  </div>
                </div>
                {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : null}
                <div className="space-y-2">
                  {(row.rutas || []).length === 0 ? (
                    <p className="text-muted-foreground">Sin rutas recientes</p>
                  ) : (
                    (row.rutas || []).map((ruta, index) => {
                      const abierta = rutaAbierta === ruta.id;
                      const paradas = [...(ruta.pedidos || [])].sort((a, b) => (a.orden_entrega || 0) - (b.orden_entrega || 0));
                      const entregados = paradas.filter((p) => p.estado_entrega === "entregado" || p.pedido?.estado === "entregado").length;
                      const km = Number(ruta.distancia_estimada) || 0;
                      const turno = turnoDe(ruta.franja);
                      return (
                        <Collapsible
                          key={ruta.id}
                          open={abierta}
                          onOpenChange={(open) => setRutaAbierta(open ? ruta.id : null)}
                          className={`rounded-xl ${index % 2 === 0 ? "bg-muted text-foreground" : "bg-primary/15 text-foreground"}`}
                        >
                          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
                            <span>
                              <span className="block font-medium">{ruta.nombre_ruta}</span>
                              <span className="text-xs opacity-80">
                                {fechaCorta(ruta.fecha_ruta)}
                                {turno ? ` · Turno ${turno.toLowerCase()}` : ""}
                                {" · "}
                                {ESTADO_RUTA[ruta.estado] || ruta.estado}
                              </span>
                            </span>
                            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${abierta ? "rotate-180" : ""}`} />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-2 px-3 pb-3 text-xs">
                            {paradas.length === 0 ? (
                              <p>Esta ruta no tiene pedidos asignados.</p>
                            ) : (
                              <>
                                <p>
                                  {paradas.length} {paradas.length === 1 ? "pedido" : "pedidos"}
                                  {" · "}
                                  {entregados} entregados
                                  {km > 0 ? ` · ${km} km` : ""}
                                </p>
                                <ul className="space-y-2">
                                  {paradas.map((parada) => (
                                    <li key={parada.id}>
                                      <p className="font-medium">
                                        {parada.pedido?.numero_pedido || `Pedido ${parada.id}`}
                                        {parada.pedido?.cliente?.nombre_completo ? ` · ${parada.pedido.cliente.nombre_completo}` : ""}
                                        {" · "}
                                        {ESTADO_PARADA[parada.estado_entrega || ""] || parada.estado_entrega || "—"}
                                      </p>
                                      {parada.pedido?.direccion_entrega ? (
                                        <p className="opacity-80">{parada.pedido.direccion_entrega}</p>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
              <p className="text-sm text-muted-foreground">Última entrega: {fechaCorta(row.fecha_ultima_entrega)}</p>
              <div className="flex gap-2">
                {wa ? (
                  <Button variant="outline" asChild>
                    <a href={wa} target="_blank" rel="noreferrer">Contactar WhatsApp</a>
                  </Button>
                ) : null}
                <Button onClick={onClose}>Cerrar perfil</Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
