import { useState, useMemo } from "react";
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
import { MapPin, Truck, Plus, Users, MoreHorizontal, Calendar, Navigation, Sparkles } from "lucide-react";

const RouteManagement = () => {
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [routes, setRoutes] = useState<{ [key: string]: any[] }>({});
  const [drivers, setDrivers] = useState([
    { id: 1, name: "Juan Pérez", vehicle: "Moto 001", phone: "+52 55 1234 5678" },
    { id: 2, name: "Ana López", vehicle: "Camión 002", phone: "+52 33 2345 6789" },
    { id: 3, name: "Carlos Ruiz", vehicle: "Moto 003", phone: "+52 81 3456 7890" },
    { id: 4, name: "María García", vehicle: "Camión 004", phone: "+52 22 4567 8901" },
  ]);

  // Datos de ejemplo de pedidos del día
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

  const cities = ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana"];

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

  const addOrderToRoute = (orderId: number, routeId: string) => {
    const order = filteredOrders.find(o => o.id === orderId);
    if (!order) return;

    // Remove from other routes first
    const newRoutes = { ...routes };
    Object.keys(newRoutes).forEach(rId => {
      newRoutes[rId] = newRoutes[rId].filter(o => o.id !== orderId);
    });

    // Add to new route
    if (!newRoutes[routeId]) {
      newRoutes[routeId] = [];
    }
    newRoutes[routeId].push(order);
    
    setRoutes(newRoutes);
  };

  const removeOrderFromRoute = (orderId: number) => {
    const newRoutes = { ...routes };
    Object.keys(newRoutes).forEach(routeId => {
      newRoutes[routeId] = newRoutes[routeId].filter(order => order.id !== orderId);
    });
    setRoutes(newRoutes);
  };

  const assignDriverToRoute = (routeId: string, driverId: number) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    
    // Aquí podrías actualizar el estado para asignar el conductor
    console.log(`Asignando ${driver.name} a Ruta ${routeId}`);
  };

  const deleteRoute = (routeId: string) => {
    const newRoutes = { ...routes };
    delete newRoutes[routeId];
    setRoutes(newRoutes);
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
          <Button onClick={createNewRoute} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Ruta Manual
          </Button>
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
                    <SelectItem key={city} value={city}>{city}</SelectItem>
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
                <div><strong>{filteredOrders.length}</strong> pedidos encontrados</div>
                <div><strong>{unassignedOrders.length}</strong> sin asignar</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Optimizer */}
      {selectedCity && filteredOrders.length > 0 && (
        <AIRouteOptimizer
          orders={filteredOrders}
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
                Pedidos Sin Asignar ({unassignedOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {unassignedOrders.map(order => (
                <div key={order.id} className="p-3 border rounded-lg bg-card hover:bg-accent/50 cursor-grab">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{order.customer}</div>
                      <div className="text-xs text-muted-foreground">{order.address}</div>
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
                        {Object.keys(routes).map(routeId => (
                          <DropdownMenuItem
                            key={routeId}
                            onClick={() => addOrderToRoute(order.id, routeId)}
                          >
                            Asignar a Ruta {routeId}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Rutas Creadas */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Navigation className="h-5 w-5" />
                Rutas Creadas ({Object.keys(routes).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {Object.keys(routes).map(routeId => {
                const routeOrders = routes[routeId];
                const { totalValue, totalOrders } = getRouteStats(routeOrders);
                
                return (
                  <div key={routeId} className="border rounded-lg p-3 bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-primary-foreground">
                          Ruta {routeId}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {totalOrders} pedidos
                        </span>
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
                              onClick={() => assignDriverToRoute(routeId, driver.id)}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              Asignar a {driver.name}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            onClick={() => deleteRoute(routeId)}
                            className="text-destructive"
                          >
                            Eliminar Ruta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="text-xs text-muted-foreground mb-2">
                      Total: ${totalValue.toLocaleString('es-CO')}
                    </div>

                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {routeOrders.map(order => (
                        <div key={order.id} className="p-2 bg-accent/30 rounded text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{order.orderNumber}</div>
                              <div className="text-muted-foreground">{order.customer}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOrderFromRoute(order.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
              {drivers.map(driver => (
                <div key={driver.id} className="p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{driver.name}</div>
                      <div className="text-xs text-muted-foreground">{driver.vehicle}</div>
                      <div className="text-xs text-muted-foreground">{driver.phone}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Disponible
                    </Badge>
                  </div>
                </div>
              ))}
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
              Mapa de Rutas - {selectedCity}
            </CardTitle>
            <CardDescription>
              Visualización de pedidos y rutas planificadas para {selectedDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RouteMap 
              orders={filteredOrders.map(order => ({
                ...order,
                route: Object.keys(routes).find(routeId => 
                  routes[routeId].some(r => r.id === order.id)
                )
              }))}
              routes={routes}
              onOrderRouteChange={() => {}}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RouteManagement;