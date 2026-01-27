import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Package, MapPin, User, Phone, Mail, CheckCircle2, XCircle, Truck, Navigation, AlertCircle, RefreshCw } from "lucide-react";
import { useRepartidorAuth } from "@/hooks/useRepartidorAuth";
import { driversService } from "@/services/driversService";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Pedido {
  id: number;
  numero_pedido: string;
  direccion_entrega: string;
  fecha_pedido: string;
  fecha_entrega_estimada: string;
  total: number;
  estado_pedido: string;
  estado_entrega: string;
  orden_entrega: number;
  notas_entrega?: string;
  cliente: {
    id: number;
    nombre_completo: string;
    telefono: string;
    email: string;
  };
  productos?: any[];
  paquetes?: any[];
  ruta_id: number;
  ruta_pedido_id: number;
}

const RepartidorDashboard = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [showNotasDialog, setShowNotasDialog] = useState(false);
  const [notas, setNotas] = useState("");
  const [fechaActual, setFechaActual] = useState<string>("");
  const { repartidor, isAuthenticated, isLoading: authLoading, logout } = useRepartidorAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Función helper para parsear fecha en zona horaria local
  const parseLocalDate = (dateString: string): Date => {
    // Si la fecha viene en formato YYYY-MM-DD, parsearla manualmente
    // para evitar problemas de zona horaria UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Si viene en otro formato, usar el constructor normal
    return new Date(dateString);
  };

  // Log para debug
  useEffect(() => {
    console.log('RepartidorDashboard - repartidor desde hook:', repartidor);
    console.log('RepartidorDashboard - repartidor desde localStorage:', driversService.getRepartidorData());
  }, [repartidor]);

  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true);
      // Enviar el ID del repartidor autenticado
      const repartidorId = repartidor?.id;
      const response = await driversService.getPedidosDelDia(repartidorId);
      if (response.success && response.data) {
        setPedidos(response.data.pedidos);
        if (response.data.fecha) {
          setFechaActual(response.data.fecha);
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudieron cargar los pedidos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      toast({
        title: "Error",
        description: "Error al cargar los pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Esperar a que termine la verificación inicial de autenticación
    if (authLoading) {
      return; // No hacer nada mientras se verifica la autenticación
    }
    
    // Solo verificar autenticación después de que termine la carga inicial
    if (!isAuthenticated) {
      console.log('No autenticado, redirigiendo al login');
      navigate("/repartidores/login", { replace: true });
      return;
    }
    
    // Solo cargar pedidos si el repartidor está disponible
    if (repartidor?.id) {
      loadPedidos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, repartidor?.id]);

  const handleUpdateEstado = async (
    pedido: Pedido,
    nuevoEstado: "pendiente" | "en_camino" | "en_ubicacion" | "entregado" | "no_entregado"
  ) => {
    // Si es "no_entregado", mostrar diálogo para notas
    if (nuevoEstado === "no_entregado") {
      setSelectedPedido(pedido);
      setNotas("");
      setShowNotasDialog(true);
      return;
    }

    await actualizarEstado(pedido, nuevoEstado);
  };

  const actualizarEstado = async (
    pedido: Pedido,
    nuevoEstado: "pendiente" | "en_camino" | "en_ubicacion" | "entregado" | "no_entregado",
    notasTexto?: string
  ) => {
    try {
      setUpdating(pedido.id);
      const response = await driversService.updateEstadoPedido(
        pedido.id,
        nuevoEstado,
        notasTexto
      );

      if (response.success) {
        toast({
          title: "Éxito",
          description: response.message || "Estado actualizado correctamente",
        });
        await loadPedidos();
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudo actualizar el estado",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
      setShowNotasDialog(false);
      setSelectedPedido(null);
      setNotas("");
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-gray-500";
      case "en_camino":
        return "bg-blue-500";
      case "en_ubicacion":
        return "bg-yellow-500";
      case "entregado":
        return "bg-green-500";
      case "no_entregado":
      case "fallido":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "en_camino":
        return "En Camino";
      case "en_ubicacion":
        return "En la Ubicación";
      case "entregado":
        return "Entregado";
      case "no_entregado":
      case "fallido":
        return "No Entregado";
      default:
        return estado;
    }
  };

  const getSiguienteEstado = (estadoActual: string): string[] => {
    switch (estadoActual) {
      case "pendiente":
        return ["en_camino"];
      case "en_camino":
        return ["en_ubicacion", "entregado", "no_entregado"];
      case "en_ubicacion":
        return ["entregado", "no_entregado"];
      case "entregado":
        return [];
      case "no_entregado":
      case "fallido":
        return [];
      default:
        return ["en_camino"];
    }
  };

  // Mostrar loading mientras se verifica la autenticación o se cargan los pedidos
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mis Pedidos del Día</h1>
            <p className="text-muted-foreground">
              {repartidor?.nombre_completo} - {fechaActual 
                ? parseLocalDate(fechaActual).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadPedidos}
              disabled={loading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" onClick={logout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pedidos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">
                {pedidos.filter(p => p.estado_entrega === "pendiente").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>En Proceso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {pedidos.filter(p => ["en_camino", "en_ubicacion"].includes(p.estado_entrega)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Entregados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {pedidos.filter(p => p.estado_entrega === "entregado").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pedidos */}
        {pedidos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay pedidos asignados para hoy</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => {
              const siguienteEstados = getSiguienteEstado(pedido.estado_entrega);
              const isUpdating = updating === pedido.id;
              
              // Usar ruta_pedido_id como key única, o una combinación si no existe
              const uniqueKey = pedido.ruta_pedido_id 
                ? `ruta-${pedido.ruta_id}-pedido-${pedido.id}-${pedido.ruta_pedido_id}`
                : `pedido-${pedido.id}-ruta-${pedido.ruta_id}`;

              return (
                <Card key={uniqueKey} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Pedido #{pedido.numero_pedido}
                        </CardTitle>
                        <CardDescription>
                          Orden de entrega: {pedido.orden_entrega}
                        </CardDescription>
                      </div>
                      <Badge className={getEstadoColor(pedido.estado_entrega)}>
                        {getEstadoLabel(pedido.estado_entrega)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Información del Cliente */}
                    <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                      <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{pedido.cliente.nombre_completo}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {pedido.cliente.telefono}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {pedido.cliente.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dirección */}
                    <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                      <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">Dirección de Entrega</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {pedido.direccion_entrega}
                        </p>
                      </div>
                    </div>

                    {/* Detalle del Pedido - Productos */}
                    {(pedido.productos && pedido.productos.length > 0) && (
                      <div className="space-y-2">
                        <p className="font-medium text-sm text-muted-foreground">Productos</p>
                        <div className="space-y-2">
                          {pedido.productos.map((producto: any, index: number) => (
                            <div 
                              key={`producto-${producto.id || index}`}
                              className="flex items-center justify-between p-3 bg-background border rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {producto.producto?.nombre || 'Producto sin nombre'}
                                </p>
                                {producto.producto?.sku && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    SKU: {producto.producto.sku}
                                  </p>
                                )}
                                {producto.producto?.descripcion && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {producto.producto.descripcion}
                                  </p>
                                )}
                              </div>
                              <div className="ml-4 text-right">
                                <p className="font-semibold text-sm">
                                  Cantidad: {producto.cantidad || 1}
                                </p>
                                {producto.precio_unitario && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ${Number(producto.precio_unitario || 0).toFixed(2)} c/u
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detalle del Pedido - Paquetes */}
                    {(pedido.paquetes && pedido.paquetes.length > 0) && (
                      <div className="space-y-2">
                        <p className="font-medium text-sm text-muted-foreground">Paquetes</p>
                        <div className="space-y-2">
                          {pedido.paquetes.map((paquete: any, index: number) => (
                            <div 
                              key={`paquete-${paquete.id || index}`}
                              className="flex items-center justify-between p-3 bg-background border rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {paquete.paquete?.nombre || 'Paquete sin nombre'}
                                </p>
                                {paquete.paquete?.descripcion && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {paquete.paquete.descripcion}
                                  </p>
                                )}
                              </div>
                              <div className="ml-4 text-right">
                                <p className="font-semibold text-sm">
                                  Cantidad: {paquete.cantidad || 1}
                                </p>
                                {paquete.precio_unitario && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ${Number(paquete.precio_unitario || 0).toFixed(2)} c/u
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                      <span className="font-medium">Total del Pedido</span>
                      <span className="text-xl font-bold">${Number(pedido.total || 0).toFixed(2)}</span>
                    </div>

                    {/* Notas si existen */}
                    {pedido.notas_entrega && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{pedido.notas_entrega}</AlertDescription>
                      </Alert>
                    )}

                    {/* Botones de Acción */}
                    {siguienteEstados.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        {siguienteEstados.map((estado) => (
                          <Button
                            key={estado}
                            variant={estado === "entregado" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdateEstado(pedido, estado as any)}
                            disabled={isUpdating}
                            className={
                              estado === "entregado"
                                ? "bg-green-600 hover:bg-green-700"
                                : estado === "no_entregado"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : ""
                            }
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : estado === "en_camino" ? (
                              <Truck className="h-4 w-4 mr-2" />
                            ) : estado === "en_ubicacion" ? (
                              <Navigation className="h-4 w-4 mr-2" />
                            ) : estado === "entregado" ? (
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            {getEstadoLabel(estado)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog para notas cuando no se entrega */}
      <Dialog open={showNotasDialog} onOpenChange={setShowNotasDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como No Entregado</DialogTitle>
            <DialogDescription>
              Por favor, indica el motivo por el cual no se pudo entregar el pedido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notas">Motivo o Notas</Label>
              <Textarea
                id="notas"
                placeholder="Ej: Cliente no se encontraba, dirección incorrecta, etc."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotasDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedPedido) {
                  actualizarEstado(selectedPedido, "no_entregado", notas);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar No Entregado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepartidorDashboard;
