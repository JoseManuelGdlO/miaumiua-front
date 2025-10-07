import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RouteMap from "@/components/RouteMap";
import AIRouteOptimizer from "@/components/AIRouteOptimizer";
import { DraggableRouteCard } from "@/components/DraggableRouteCard";
import { DraggableOrderCard } from "@/components/DraggableOrderCard";
import { DraggableAssignedOrderCard } from "@/components/DraggableAssignedOrderCard";
import { DraggableDriverCard } from "@/components/DraggableDriverCard";
import { DropZone } from "@/components/DropZone";
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { MapPin, Truck, Plus, Users, MoreHorizontal, Calendar, Navigation, Sparkles, Loader2 } from "lucide-react";
import { routesService, Route, AvailableDriver, AvailableOrder } from "@/services/routesService";
import { usersService } from "@/services/usersService";
import { driversService, Driver } from "@/services/driversService";
import { citiesService } from "@/services/citiesService";

// Interfaz para repartidores disponibles (versión simplificada)
interface AvailableDriverSimple {
  id: number;
  codigo_repartidor: string;
  nombre_completo: string;
  tipo_vehiculo: string;
  capacidad_carga: number;
  calificacion_promedio: number;
  total_entregas: number;
}
import { useToast } from "@/hooks/use-toast";
import { canCreate, canEdit, canDelete, canViewStats } from "@/utils/permissions";

const RouteManagement = () => {
  const { toast } = useToast();
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<(Driver | AvailableDriverSimple)[]>([]);
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    if (selectedCity && selectedDate) {
      loadRouteData();
    }
  }, [selectedCity, selectedDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Cargar ciudades
      const citiesResponse = await citiesService.getAllCities();
      if (citiesResponse.success) {
        setCities(citiesResponse.data.cities);
      }

      // Cargar repartidores disponibles
      if (selectedCity) {
        const driversResponse = await driversService.getAvailableDrivers(parseInt(selectedCity));
        if (driversResponse.success) {
          setDrivers(driversResponse.data);
        }
      } else {
        // Si no hay ciudad seleccionada, cargar todos los repartidores
        const driversResponse = await driversService.getAllDrivers();
        if (driversResponse.success) {
          setDrivers(driversResponse.data.repartidores);
        }
      }

      // Cargar estadísticas (si el endpoint está disponible)
      try {
        const statsResponse = await routesService.getRouteStats(selectedDate, selectedCity ? parseInt(selectedCity) : undefined);
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.log('Estadísticas no disponibles:', error);
      }
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRouteData = async () => {
    if (!selectedCity || !selectedDate) return;

    try {
      setLoading(true);
      
      // Cargar rutas del día
      const routesResponse = await routesService.getRoutesByDate(selectedDate, parseInt(selectedCity));
      if (routesResponse.success) {
        setRoutes(routesResponse.data.rutas || []);
      }

      // Cargar pedidos no asignados
      const ordersResponse = await routesService.getUnassignedOrdersByDate(selectedDate, parseInt(selectedCity));
      if (ordersResponse.success) {
        setAvailableOrders(ordersResponse.data.pedidos || []);
      }

      // Cargar repartidores disponibles para la ciudad seleccionada
      const driversResponse = await driversService.getAvailableDrivers(parseInt(selectedCity));
      if (driversResponse.success) {
        setDrivers(driversResponse.data);
      }
    } catch (error) {
      console.error('Error cargando datos de rutas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las rutas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRouteDataSilently = async () => {
    if (!selectedCity || !selectedDate) return;

    try {
      // Cargar rutas del día
      const routesResponse = await routesService.getRoutesByDate(selectedDate, parseInt(selectedCity));
      if (routesResponse.success) {
        setRoutes(routesResponse.data.rutas || []);
      }

      // Cargar pedidos no asignados
      const ordersResponse = await routesService.getUnassignedOrdersByDate(selectedDate, parseInt(selectedCity));
      if (ordersResponse.success) {
        setAvailableOrders(ordersResponse.data.pedidos || []);
      }

      // Cargar repartidores disponibles para la ciudad seleccionada
      const driversResponse = await driversService.getAvailableDrivers(parseInt(selectedCity));
      if (driversResponse.success) {
        setDrivers(driversResponse.data);
      }
    } catch (error) {
      console.error('Error cargando datos de rutas en background:', error);
      // Solo mostrar error si es crítico, no para operaciones de drag and drop
    }
  };

  // Datos de ejemplo de pedidos del día (mantener para compatibilidad con componentes existentes)
  const allOrders = [
    {
      id: 1,
      orderNumber: "MM-2024-0001",
      customer: "María González",
      phone: "+52 55 1234 5678",
      address: "Calle 127 #15-45, Apto 502",
      city: "Ciudad de México",
      zone: "Polanco",
      products: "2x Arena Premium 10kg",
      total: 90000,
      coordinates: { lat: 19.4326, lng: -99.1332 },
      route: null,
      driver: null
    },
    {
      id: 2,
      orderNumber: "MM-2024-0006",
      customer: "Roberto Silva", 
      phone: "+57 312 567 8901",
      address: "Carrera 15 #85-20, Casa 12",
      city: "Ciudad de México",
      zone: "Roma Norte", 
      products: "1x Arena Antibacterial 5kg",
      total: 28000,
      coordinates: { lat: 19.4200, lng: -99.1600 },
      route: null,
      driver: null
    },
    {
      id: 3,
      orderNumber: "MM-2024-0007",
      customer: "Carmen Vega",
      phone: "+57 315 678 9012", 
      address: "Calle 100 #20-30, Torre B",
      city: "Ciudad de México",
      zone: "Condesa",
      products: "3x Arena Perfumada 15kg",
      total: 156000,
      coordinates: { lat: 19.4100, lng: -99.1700 },
      route: null,
      driver: null
    },
    {
      id: 4,
      orderNumber: "MM-2024-0008", 
      customer: "Diego Morales",
      phone: "+57 318 789 0123",
      address: "Avenida 68 #45-67, Apto 801",
      city: "Ciudad de México",
      zone: "Santa Fe",
      products: "2x Arena Ultra 12kg", 
      total: 116000,
      coordinates: { lat: 19.3600, lng: -99.2600 },
      route: null,
      driver: null
    },
    {
      id: 5,
      orderNumber: "MM-2024-0009",
      customer: "Elena Ruiz",
      phone: "+57 320 890 1234",
      address: "Calle 53 #10-15, Local 3", 
      city: "Ciudad de México",
      zone: "Centro",
      products: "1x Arena Básica 8kg",
      total: 18000,
      coordinates: { lat: 19.4270, lng: -99.1276 },
      route: null,
      driver: null
    },
    {
      id: 6,
      orderNumber: "MM-2024-0010",
      customer: "Fernando Castro",
      phone: "+57 301 901 2345",
      address: "Carrera 7 #75-40, Oficina 501", 
      city: "Ciudad de México", 
      zone: "Del Valle",
      products: "4x Arena Premium 10kg",
      total: 180000,
      coordinates: { lat: 19.3800, lng: -99.1500 },
      route: null,
      driver: null
    },
    // Guadalajara
    {
      id: 7,
      orderNumber: "MM-2024-0011",
      customer: "Carlos Ramírez",
      phone: "+57 315 987 6543",
      address: "Carrera 70 #45-12, Casa 15",
      city: "Guadalajara", 
      zone: "Providencia",
      products: "3x Arena Antibacterial 5kg",
      total: 84000,
      coordinates: { lat: 20.6597, lng: -103.3496 },
      route: null,
      driver: null
    },
    {
      id: 8,
      orderNumber: "MM-2024-0012",
      customer: "Sofía Herrera",
      phone: "+57 304 123 4567",
      address: "Calle 10 #40-25, Torre 2",
      city: "Guadalajara",
      zone: "Chapultepec", 
      products: "2x Arena Perfumada 15kg",
      total: 104000,
      coordinates: { lat: 20.6700, lng: -103.3600 },
      route: null,
      driver: null
    }
  ];

  // Variables calculadas para compatibilidad con componentes existentes
  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => 
      selectedCity ? order.city === selectedCity : true
    );
  }, [selectedCity]);

  const unassignedOrders = useMemo(() => {
    const assignedOrderIds = new Set();
    routes.forEach(route => {
      if (route.pedidos) {
        route.pedidos.forEach(pedido => assignedOrderIds.add(pedido.fkid_pedido));
      }
    });
    return filteredOrders.filter(order => !assignedOrderIds.has(order.id));
  }, [filteredOrders, routes]);

  const createNewRoute = () => {
    // Esta función ya no es necesaria ya que usamos el backend
    // Se mantiene por compatibilidad pero no hace nada
  };


  const assignDriverToRoute = async (routeId: string, driverId: number, showToast: boolean = false) => {
    try {
      const response = await routesService.updateRoute(parseInt(routeId), {
        fkid_repartidor: driverId
      });
      
      if (response.success) {
        if (showToast) {
          toast({
            title: "Repartidor asignado",
            description: "El repartidor ha sido asignado a la ruta exitosamente",
          });
        }
        // Recargar datos en background sin mostrar loading
        loadRouteDataSilently();
      }
    } catch (error) {
      console.error('Error asignando repartidor:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el repartidor",
        variant: "destructive"
      });
    }
  };

  const unassignDriverFromRoute = async (routeId: string, showToast: boolean = true) => {
    try {
      console.log('🚚 Desasignando repartidor de ruta:', { routeId });
      
      const response = await routesService.unassignDriverFromRoute(parseInt(routeId));
      
      console.log('📡 Respuesta del backend:', response);
      
      if (response.success) {
        if (showToast) {
          toast({
            title: "Repartidor desasignado",
            description: "El repartidor ha sido removido de la ruta exitosamente",
          });
        }
        // Recargar datos en background sin mostrar loading
        loadRouteDataSilently();
      } else {
        toast({
          title: "Error",
          description: response.message || "No se pudo desasignar el repartidor",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error desasignando repartidor:', error);
      toast({
        title: "Error",
        description: "No se pudo desasignar el repartidor de la ruta",
        variant: "destructive"
      });
    }
  };

  const deleteRoute = async (routeId: string) => {
    try {
      const response = await routesService.deleteRoute(parseInt(routeId));
      
      if (response.success) {
        toast({
          title: "Ruta eliminada",
          description: "La ruta ha sido eliminada exitosamente",
        });
        loadRouteData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error eliminando ruta:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la ruta",
        variant: "destructive"
      });
    }
  };

  const createManualRoute = async () => {
    if (!selectedCity || !selectedDate) {
      toast({
        title: "Error",
        description: "Selecciona una ciudad y fecha",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await routesService.createRoute({
        nombre_ruta: `Ruta Manual - ${new Date().toLocaleString()}`,
        fecha_ruta: selectedDate,
        fkid_ciudad: parseInt(selectedCity),
        fkid_repartidor: drivers[0]?.id || 1, // Asignar primer repartidor disponible
        estado: "planificada",
        notas: "Ruta creada manualmente"
      });
      
      if (response.success) {
        toast({
          title: "Ruta creada",
          description: "La ruta ha sido creada exitosamente",
        });
        loadRouteData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error creando ruta:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la ruta",
        variant: "destructive"
      });
    }
  };

  const addOrderToRoute = async (orderId: number, routeId: string, showToast: boolean = false) => {
    try {
      const order = availableOrders.find(o => o.id === orderId);
    if (!order) return;

      const response = await routesService.assignOrdersToRoute(parseInt(routeId), {
        pedidos: [{
          fkid_pedido: orderId,
          orden_entrega: 1, // Se puede calcular basado en pedidos existentes
          lat: order.cliente?.lat || 0,
          lng: order.cliente?.lng || 0,
          link_ubicacion: order.cliente?.lat && order.cliente?.lng ? 
            `https://maps.google.com/?q=${order.cliente.lat},${order.cliente.lng}` : undefined,
          notas_entrega: "Asignado desde planeación de rutas"
        }]
      });
      
      if (response.success) {
        if (showToast) {
          toast({
            title: "Pedido asignado",
            description: "El pedido ha sido asignado a la ruta exitosamente",
          });
        }
        // Recargar datos en background sin mostrar loading
        loadRouteDataSilently();
      }
    } catch (error) {
      console.error('Error asignando pedido:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el pedido a la ruta",
        variant: "destructive"
      });
    }
  };

  const removeOrderFromRoute = async (orderId: number, routeId: string, showToast: boolean = false) => {
    try {
      console.log('🔍 Intentando desasignar pedido:', { orderId, routeId });
      
      // Buscar el pedido en la ruta para obtener su ID de relación
      const route = routes.find(r => r.id.toString() === routeId);
      if (!route || !route.pedidos) {
        console.log('❌ Ruta no encontrada o sin pedidos:', { routeId, route });
        return;
      }

      const routeOrder = route.pedidos.find(p => p.fkid_pedido === orderId);
      if (!routeOrder) {
        console.log('❌ Pedido no encontrado en la ruta:', { orderId, routeId });
        if (showToast) {
          toast({
            title: "Error",
            description: `Pedido ID ${orderId} no encontrado en la ruta ${routeId}`,
            variant: "destructive"
          });
        }
        return;
      }

      console.log('✅ Pedido encontrado en ruta:', { 
        routeOrderId: routeOrder.id, 
        fkid_pedido: routeOrder.fkid_pedido,
        orden_entrega: routeOrder.orden_entrega
      });

      // Usar el endpoint real para desasignar el pedido
      console.log('🚀 Llamando al endpoint:', {
        rutaId: parseInt(routeId),
        pedidoId: orderId,
        endpoint: `DELETE /api/rutas/${parseInt(routeId)}/pedidos/${orderId}`
      });
      
      const response = await routesService.removeOrderFromRoute(parseInt(routeId), orderId);
      
      console.log('📡 Respuesta del backend:', response);
      
      if (response.success) {
        if (showToast) {
          toast({
            title: "Pedido desasignado",
            description: "El pedido ha sido removido de la ruta exitosamente",
          });
        }
        // Recargar datos en background sin mostrar loading
        loadRouteDataSilently();
      } else {
        toast({
          title: "Error",
          description: response.message || "No se pudo desasignar el pedido",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error desasignando pedido:', error);
      toast({
        title: "Error",
        description: "No se pudo desasignar el pedido de la ruta",
        variant: "destructive"
      });
    }
  };

  // Funciones para drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setDraggedItem(active.data.current);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    // Si se arrastra un pedido (desde pedidos sin asignar)
    if (activeData?.type === 'order') {
      const order = activeData.order;
      
      // Si se suelta en una ruta
      if (over.id.toString().startsWith('route-')) {
        const routeId = over.id.toString().replace('route-', '');
        await addOrderToRoute(order.id, routeId, false); // Sin toast
      }
      // Si se suelta en la zona de pedidos sin asignar
      else if (over.id === 'unassigned-orders') {
        // No hacer nada, el pedido ya está en la zona correcta
      }
    }

    // Si se arrastra un pedido asignado (desde dentro de una ruta)
    if (activeData?.type === 'assigned-order') {
      const order = activeData.order;
      const routeOrder = activeData.routeOrder;
      
      console.log('🚚 Arrastrando pedido asignado:', { 
        orderId: order.id, 
        routeOrderId: routeOrder.id,
        fkid_pedido: routeOrder.fkid_pedido,
        fkid_ruta: routeOrder.fkid_ruta
      });
      
      // Si se suelta en la zona de pedidos sin asignar
      if (over.id === 'unassigned-orders') {
        console.log('🎯 Soltando en zona de pedidos sin asignar');
        // Usar directamente el ID de la ruta del routeOrder
        await removeOrderFromRoute(order.id, routeOrder.fkid_ruta.toString(), false); // Sin toast
      }
      // Si se suelta en otra ruta
      else if (over.id.toString().startsWith('route-')) {
        const newRouteId = over.id.toString().replace('route-', '');
        console.log('🎯 Soltando en nueva ruta:', { newRouteId });
        
        // Primero desasignar de la ruta actual usando el ID correcto
        await removeOrderFromRoute(order.id, routeOrder.fkid_ruta.toString(), false); // Sin toast
        
        // Luego asignar a la nueva ruta
        await addOrderToRoute(order.id, newRouteId, false); // Sin toast
      }
    }

    // Si se arrastra un repartidor
    if (activeData?.type === 'driver') {
      const driver = activeData.driver;
      
      // Si se suelta en una ruta
      if (over.id.toString().startsWith('route-')) {
        const routeId = over.id.toString().replace('route-', '');
        await assignDriverToRoute(routeId, driver.id, false); // Sin toast
      }
    }

    setActiveId(null);
    setDraggedItem(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Aquí puedes agregar lógica adicional si necesitas feedback visual durante el drag
  };

  const getRouteStats = (routeOrders: any[]) => {
    const totalValue = routeOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = routeOrders.length;
    return { totalValue, totalOrders };
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Planeación Inteligente de Rutas</h1>
          <p className="text-muted-foreground">
            Organiza pedidos automáticamente con IA o manualmente por rutas y asigna repartidores
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate('routes') && (
            <Button onClick={createManualRoute} variant="outline" className="gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
            <Plus className="h-4 w-4" />
              )}
            Nueva Ruta Manual
          </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Planeación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city.id} value={city.id.toString()}>{city.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Entrega</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                <div><strong>{availableOrders.length}</strong> pedidos disponibles</div>
                <div><strong>{routes.length}</strong> rutas creadas</div>
                {stats && (
                  <div><strong>{stats.total_pedidos}</strong> total pedidos</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos Sin Asignar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Pedidos Disponibles ({availableOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              <DropZone id="unassigned-orders" className="min-h-[200px]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                ) : (
                  <div className="space-y-2">
                    {availableOrders.map(order => (
                      <DraggableOrderCard key={order.id} order={order} />
                    ))}
                    {availableOrders.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No hay pedidos disponibles
                  </div>
                    )}
                </div>
                )}
              </DropZone>
            </CardContent>
          </Card>
        </div>

        {/* Rutas Creadas */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Navigation className="h-5 w-5" />
                Rutas Creadas ({routes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
              ) : (
                <div className="space-y-3">
                  {routes.map(route => (
                    <DropZone key={route.id} id={`route-${route.id}`}>
                      <DraggableRouteCard
                        route={route}
                        onAssignDriver={assignDriverToRoute}
                        onUnassignDriver={unassignDriverFromRoute}
                        onDeleteRoute={deleteRoute}
                        onAddOrder={addOrderToRoute}
                        drivers={drivers}
                        canEdit={canEdit('routes')}
                        canDelete={canDelete('routes')}
                      />
                    </DropZone>
                  ))}
                  {routes.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No hay rutas creadas
                    </div>
                  )}
                    </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Repartidores */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                Repartidores Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
              {drivers.map(driver => (
                    <DraggableDriverCard key={driver.id} driver={driver} />
                  ))}
                  {drivers.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No hay repartidores disponibles
                    </div>
                  )}
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mapa */}
      {selectedCity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa de Rutas - {cities.find(c => c.id.toString() === selectedCity)?.nombre || selectedCity}
            </CardTitle>
            <CardDescription>
              Visualización de pedidos y rutas planificadas para {selectedDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RouteMap 
              orders={availableOrders.map(order => ({
                id: order.id,
                orderNumber: order.numero_pedido,
                customer: order.cliente?.nombre_completo || 'Cliente',
                phone: order.cliente?.telefono || '',
                address: order.direccion_entrega,
                city: cities.find(c => c.id === order.fkid_ciudad)?.nombre || 'Ciudad',
                zone: 'Zona',
                products: 'Productos',
                total: order.total,
                coordinates: { lat: 0, lng: 0 }, // Se puede obtener de geolocalización
                route: routes.find(r => r.pedidos?.some(p => p.fkid_pedido === order.id))?.id.toString() || null,
                driver: null
              }))}
              routes={routes.reduce((acc, route) => {
                acc[route.id.toString()] = route.pedidos?.map(p => ({
                  id: p.pedido?.id || 0,
                  orderNumber: p.pedido?.numero_pedido || '',
                  customer: p.pedido?.cliente?.nombre_completo || 'Cliente',
                  phone: p.pedido?.cliente?.telefono || '',
                  address: p.pedido?.direccion_entrega || '',
                  city: 'Ciudad',
                  zone: 'Zona',
                  products: 'Productos',
                  total: 0,
                  coordinates: { lat: p.lat, lng: p.lng },
                  route: route.id.toString(),
                  driver: route.repartidor?.nombre_completo || null
                })) || [];
                return acc;
              }, {} as { [key: string]: any[] })}
              onOrderRouteChange={() => {}}
            />
          </CardContent>
        </Card>
      )}

      {/* AI Optimizer - Movido hasta abajo */}
      {selectedCity && availableOrders.length > 0 && (
        <div className="mt-6">
          <AIRouteOptimizer
            orders={availableOrders.map(order => ({
              id: order.id,
              orderNumber: order.numero_pedido,
              customer: order.cliente?.nombre_completo || 'Cliente',
              phone: order.cliente?.telefono || '',
              address: order.direccion_entrega,
              city: cities.find(c => c.id === order.fkid_ciudad)?.nombre || 'Ciudad',
              zone: 'Zona',
              products: 'Productos',
              total: order.total,
              coordinates: { lat: 0, lng: 0 }, // Se puede obtener de geolocalización
              route: null,
              driver: null
            }))}
            city={selectedCity}
            date={selectedDate}
            onRoutesGenerated={(newRoutes) => {
              // Esta función ya no es necesaria ya que usamos el backend
              // Se mantiene por compatibilidad pero no hace nada
            }}
          />
        </div>
      )}
      </div>
      
       <DragOverlay>
         {activeId && draggedItem ? (
           <div className="opacity-50">
             {draggedItem.type === 'order' && (
               <DraggableOrderCard order={draggedItem.order} />
             )}
             {draggedItem.type === 'assigned-order' && (
               <DraggableAssignedOrderCard routeOrder={draggedItem.routeOrder} />
             )}
             {draggedItem.type === 'driver' && (
               <DraggableDriverCard driver={draggedItem.driver} />
      )}
    </div>
         ) : null}
       </DragOverlay>
    </DndContext>
  );
};

export default RouteManagement;