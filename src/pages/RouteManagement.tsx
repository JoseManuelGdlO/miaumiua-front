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
import { MapPin, Truck, Plus, Users, MoreHorizontal, Calendar, Navigation, Sparkles, Loader2 } from "lucide-react";
import { routesService, Route, AvailableDriver, AvailableOrder } from "@/services/routesService";
import { usersService } from "@/services/usersService";
import { citiesService } from "@/services/citiesService";
import { useToast } from "@/hooks/use-toast";
import { canCreate, canEdit, canDelete, canViewStats } from "@/utils/permissions";

const RouteManagement = () => {
  const { toast } = useToast();
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

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

      // Cargar repartidores (usuarios con rol repartidor)
      const driversResponse = await usersService.getDrivers();
      if (driversResponse.success) {
        setDrivers(driversResponse.data.users);
      }

      // Cargar estadísticas
      const statsResponse = await routesService.getRouteStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
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
      
      // Cargar rutas para la ciudad y fecha seleccionada
      const routesResponse = await routesService.getAllRoutes({
        ciudad: parseInt(selectedCity),
        fecha: selectedDate,
        limit: 100
      });
      
      if (routesResponse.success) {
        setRoutes(routesResponse.data.routes);
      }

      // Cargar pedidos disponibles
      const ordersResponse = await routesService.getAvailableOrders({
        ciudad: parseInt(selectedCity),
        fecha: selectedDate,
        estado: 'pendiente'
      });
      
      if (ordersResponse.success) {
        setAvailableOrders(ordersResponse.data.orders);
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
    Object.values(routes).forEach(routeOrders => {
      routeOrders.forEach(order => assignedOrderIds.add(order.id));
    });
    return filteredOrders.filter(order => !assignedOrderIds.has(order.id));
  }, [filteredOrders, routes]);

  const createNewRoute = () => {
    const routeIds = Object.keys(routes);
    const nextRouteId = String.fromCharCode(65 + routeIds.length); // A, B, C, etc.
    setRoutes(prev => ({
      ...prev,
      [nextRouteId]: []
    }));
  };

  const removeOrderFromRoute = (orderId: number) => {
    const newRoutes = { ...routes };
    Object.keys(newRoutes).forEach(routeId => {
      newRoutes[routeId] = newRoutes[routeId].filter(order => order.id !== orderId);
    });
    setRoutes(newRoutes);
  };

  const assignDriverToRoute = async (routeId: string, driverId: number) => {
    try {
      const response = await routesService.updateRoute(parseInt(routeId), {
        fkid_repartidor: driverId
      });
      
      if (response.success) {
        toast({
          title: "Repartidor asignado",
          description: "El repartidor ha sido asignado a la ruta exitosamente",
        });
        loadRouteData(); // Recargar datos
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
        notas: "Ruta creada manualmente",
        orden_prioridad: 1
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

  const addOrderToRoute = async (orderId: number, routeId: string) => {
    try {
      const order = availableOrders.find(o => o.id === orderId);
      if (!order) return;

      const response = await routesService.assignOrderToRoute({
        fkid_ruta: parseInt(routeId),
        fkid_pedido: orderId,
        orden_entrega: 1, // Se puede calcular basado en pedidos existentes
        lat: 0, // Se puede obtener de geolocalización
        lng: 0, // Se puede obtener de geolocalización
        notas_entrega: "Asignado desde planeación de rutas"
      });
      
      if (response.success) {
        toast({
          title: "Pedido asignado",
          description: "El pedido ha sido asignado a la ruta exitosamente",
        });
        loadRouteData(); // Recargar datos
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

  const getRouteStats = (routeOrders: any[]) => {
    const totalValue = routeOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = routeOrders.length;
    return { totalValue, totalOrders };
  };

  return (
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

      {/* AI Optimizer */}
      {selectedCity && availableOrders.length > 0 && (
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
          onRoutesGenerated={(newRoutes) => setRoutes(newRoutes)}
        />
      )}

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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                availableOrders.map(order => (
                <div key={order.id} className="p-3 border rounded-lg bg-card hover:bg-accent/50 cursor-grab">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{order.numero_pedido}</div>
                      <div className="text-sm text-muted-foreground">{order.cliente?.nombre_completo || 'Cliente'}</div>
                      <div className="text-xs text-muted-foreground">{order.direccion_entrega}</div>
                      <div className="text-xs font-medium text-primary mt-1">
                        ${order.total.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {routes.map(route => (
                          <DropdownMenuItem
                            key={route.id}
                            onClick={() => addOrderToRoute(order.id, route.id.toString())}
                          >
                            Asignar a {route.nombre_ruta}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                ))
              )}
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
                routes.map(route => {
                  const totalOrders = route.total_pedidos || 0;
                  const totalValue = route.pedidos?.reduce((sum, p) => sum + (p.pedido?.total || 0), 0) || 0;
                
                return (
                  <div key={route.id} className="border rounded-lg p-3 bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-primary-foreground">
                          {route.nombre_ruta}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {totalOrders} pedidos
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {route.estado}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {drivers.map(driver => (
                            <DropdownMenuItem
                              key={driver.id}
                              onClick={() => assignDriverToRoute(route.id.toString(), driver.id)}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              Asignar a {driver.nombre_completo}
                            </DropdownMenuItem>
                          ))}
                          {canDelete('routes') && (
                            <DropdownMenuItem
                              onClick={() => deleteRoute(route.id.toString())}
                              className="text-destructive"
                            >
                              Eliminar Ruta
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="text-xs text-muted-foreground mb-2">
                      Total: ${totalValue.toLocaleString('es-CO')}
                      {route.repartidor && (
                        <div>Repartidor: {route.repartidor.nombre_completo}</div>
                      )}
                    </div>

                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {route.pedidos?.map(routeOrder => (
                        <div key={routeOrder.id} className="p-2 bg-accent/30 rounded text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{routeOrder.pedido?.numero_pedido}</div>
                              <div className="text-muted-foreground">{routeOrder.pedido?.cliente?.nombre_completo}</div>
                              <div className="text-muted-foreground">Orden: {routeOrder.orden_entrega}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {routeOrder.estado_entrega}
                            </Badge>
                          </div>
                        </div>
                      )) || (
                        <div className="text-xs text-muted-foreground p-2">
                          No hay pedidos asignados
                        </div>
                      )}
                    </div>
                  </div>
                );
                })
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
                drivers.map(driver => (
                  <div key={driver.id} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{driver.nombre_completo}</div>
                        <div className="text-xs text-muted-foreground">{driver.telefono || 'Sin teléfono'}</div>
                        <div className="text-xs text-muted-foreground">
                          Rutas asignadas: {driver.rutas_asignadas || 0}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {driver.capacidad_disponible > 0 ? 'Disponible' : 'Ocupado'}
                      </Badge>
                    </div>
                  </div>
                ))
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
    </div>
  );
};

export default RouteManagement;