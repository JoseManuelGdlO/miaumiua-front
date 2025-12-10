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
import { MapPin, Truck, Plus, Users, MoreHorizontal, Calendar, Navigation, Sparkles, Loader2, ChevronDown, Download, Package as PackageIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import jsPDF from "jspdf";
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
  const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set());
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<Set<number>>(new Set());

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

    // Verificar que haya repartidores disponibles
    if (drivers.length === 0) {
      toast({
        title: "Error",
        description: "No hay repartidores disponibles. Debe haber al menos un repartidor disponible para crear una ruta.",
        variant: "destructive"
      });
      return;
    }

    // Verificar que haya pedidos disponibles
    if (availableOrders.length === 0) {
      toast({
        title: "Error",
        description: "No hay pedidos disponibles. Debe haber al menos un pedido para crear una ruta.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await routesService.createRoute({
        nombre_ruta: `Ruta Manual - ${new Date().toLocaleString()}`,
        fecha_ruta: selectedDate,
        fkid_ciudad: parseInt(selectedCity),
        fkid_repartidor: drivers[0].id, // Asignar primer repartidor disponible
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

  const toggleRouteExpanded = (routeId: number) => {
    setExpandedRoutes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  const downloadRoutePDF = (route: Route) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = margin;

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalle de Ruta', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Información de la ruta
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ruta: ${route.nombre_ruta}`, margin, yPos);
      yPos += 7;
      
      doc.text(`Fecha: ${new Date(route.fecha_ruta).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, margin, yPos);
      yPos += 7;

      if (route.repartidor) {
        doc.text(`Repartidor: ${route.repartidor.nombre_completo}`, margin, yPos);
        if (route.repartidor.codigo_repartidor) {
          doc.text(`Código: ${route.repartidor.codigo_repartidor}`, margin + 60, yPos);
        }
        yPos += 7;
      }

      doc.text(`Estado: ${route.estado === 'planificada' ? 'Planificada' :
                route.estado === 'en_progreso' ? 'En Progreso' :
                route.estado === 'completada' ? 'Completada' : 'Cancelada'}`, margin, yPos);
      yPos += 10;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;

      // Listado de entregas
      if (route.pedidos && route.pedidos.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Direcciones a Entregar', margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const sortedPedidos = [...route.pedidos].sort((a, b) => (a.orden_entrega || 0) - (b.orden_entrega || 0));

        sortedPedidos.forEach((routeOrder, index) => {
          // Verificar si necesitamos una nueva página
          if (yPos > 270) {
            doc.addPage();
            yPos = margin;
          }

          // Número de orden
          doc.setFont('helvetica', 'bold');
          doc.text(`${routeOrder.orden_entrega || index + 1}.`, margin, yPos);
          
          if (routeOrder.pedido) {
            // Información del pedido
            doc.setFont('helvetica', 'normal');
            doc.text(`Pedido: ${routeOrder.pedido.numero_pedido}`, margin + 10, yPos);
            yPos += 5;

            doc.text(`Dirección: ${routeOrder.pedido.direccion_entrega}`, margin + 10, yPos);
            yPos += 5;

            if (routeOrder.pedido.cliente) {
              doc.text(`Cliente: ${routeOrder.pedido.cliente.nombre_completo}`, margin + 10, yPos);
              yPos += 5;
              if (routeOrder.pedido.cliente.telefono) {
                doc.text(`Tel: ${routeOrder.pedido.cliente.telefono}`, margin + 10, yPos);
                yPos += 5;
              }
            }

            if (routeOrder.pedido.total) {
              doc.text(`Total: $${routeOrder.pedido.total.toLocaleString('es-CO')}`, margin + 10, yPos);
              yPos += 5;
            }

            // Productos del pedido
            if (routeOrder.pedido.productos && routeOrder.pedido.productos.length > 0) {
              doc.setFont('helvetica', 'bold');
              doc.text('Productos:', margin + 10, yPos);
              yPos += 5;
              doc.setFont('helvetica', 'normal');
              routeOrder.pedido.productos.forEach((producto: any) => {
                if (yPos > 270) {
                  doc.addPage();
                  yPos = margin;
                }
                const productoText = `  • ${producto.producto?.nombre || 'Producto'} - Cant: ${producto.cantidad} - $${producto.precio_unidad?.toLocaleString('es-CO') || '0'}`;
                doc.text(productoText, margin + 10, yPos);
                yPos += 4;
              });
            }

            // Paquetes del pedido
            if (routeOrder.pedido.paquetes && routeOrder.pedido.paquetes.length > 0) {
              doc.setFont('helvetica', 'bold');
              doc.text('Paquetes:', margin + 10, yPos);
              yPos += 5;
              doc.setFont('helvetica', 'normal');
              routeOrder.pedido.paquetes.forEach((paquete: any) => {
                if (yPos > 270) {
                  doc.addPage();
                  yPos = margin;
                }
                const paqueteText = `  • ${paquete.paquete?.nombre || 'Paquete'} - Cant: ${paquete.cantidad} - $${paquete.precio_unidad?.toLocaleString('es-CO') || paquete.paquete?.precio_final?.toLocaleString('es-CO') || '0'}`;
                doc.text(paqueteText, margin + 10, yPos);
                yPos += 4;
              });
            }

            // Información adicional
            if (routeOrder.pedido.metodo_pago) {
              doc.text(`Método de pago: ${routeOrder.pedido.metodo_pago}`, margin + 10, yPos);
              yPos += 5;
            }
            if (routeOrder.pedido.telefono_referencia) {
              doc.text(`Tel. referencia: ${routeOrder.pedido.telefono_referencia}`, margin + 10, yPos);
              yPos += 5;
            }
            if (routeOrder.pedido.email_referencia) {
              doc.text(`Email referencia: ${routeOrder.pedido.email_referencia}`, margin + 10, yPos);
              yPos += 5;
            }
            if (routeOrder.pedido.notas) {
              doc.setFont('helvetica', 'italic');
              doc.text(`Notas del pedido: ${routeOrder.pedido.notas}`, margin + 10, yPos);
              doc.setFont('helvetica', 'normal');
              yPos += 5;
            }
          } else {
            doc.text(`Pedido ID: ${routeOrder.fkid_pedido}`, margin + 10, yPos);
            yPos += 5;
          }

          doc.text(`Estado: ${routeOrder.estado_entrega === 'pendiente' ? 'Pendiente' :
                    routeOrder.estado_entrega === 'en_camino' ? 'En Camino' :
                    routeOrder.estado_entrega === 'entregado' ? 'Entregado' : 'Fallido'}`, margin + 10, yPos);
          yPos += 5;

          if (routeOrder.notas_entrega) {
            doc.setFont('helvetica', 'italic');
            doc.text(`Notas: ${routeOrder.notas_entrega}`, margin + 10, yPos);
            doc.setFont('helvetica', 'normal');
            yPos += 5;
          }

          // Línea separadora entre entregas
          yPos += 2;
          doc.setLineWidth(0.2);
          doc.line(margin + 10, yPos, pageWidth - margin - 10, yPos);
          yPos += 5;
        });
      } else {
        doc.text('No hay pedidos asignados a esta ruta', margin, yPos);
        yPos += 7;
      }

      // Estadísticas al final
      if (route.distancia_estimada || route.tiempo_estimado) {
        if (yPos > 250) {
          doc.addPage();
          yPos = margin;
        }
        yPos += 5;
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 7;

        doc.setFontSize(10);
        if (route.distancia_estimada != null && typeof route.distancia_estimada === 'number') {
          doc.text(`Distancia estimada: ${route.distancia_estimada.toFixed(2)} km`, margin, yPos);
          yPos += 5;
        }
        if (route.tiempo_estimado != null && typeof route.tiempo_estimado === 'number') {
          doc.text(`Tiempo estimado: ${Math.round(route.tiempo_estimado)} min`, margin, yPos);
        }
      }

      // Guardar el PDF
      const fileName = `Ruta_${route.nombre_ruta.replace(/\s+/g, '_')}_${route.fecha_ruta}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF generado",
        description: `El detalle de la ruta se ha descargado exitosamente`,
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
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
            <Button 
              onClick={createManualRoute} 
              variant="outline" 
              className="gap-2" 
              disabled={loading || drivers.length === 0 || availableOrders.length === 0}
              title={drivers.length === 0 ? "No hay repartidores disponibles" : availableOrders.length === 0 ? "No hay pedidos disponibles" : ""}
            >
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
            orders={availableOrders.map(order => {
              // Priorizar ciudad del pedido, luego del cliente, luego del array cities
              const cityInfo = order.ciudad 
                || order.cliente?.ciudad 
                || cities.find(c => c.id === order.fkid_ciudad);
              
              return {
              id: order.id,
                orderNumber: order.numero_pedido || `PED-${order.id}`,
              customer: order.cliente?.nombre_completo || 'Cliente',
              phone: order.cliente?.telefono || '',
                address: order.direccion_entrega || 'Dirección no disponible',
                city: cityInfo?.nombre || 'Ciudad',
                estado: cityInfo?.departamento || '', // Estado/departamento para geocodificación
                ciudad: cityInfo?.nombre || '', // Nombre de la ciudad para geocodificación
              zone: 'Zona',
              products: 'Productos',
              total: order.total,
                coordinates: order.cliente?.lat && order.cliente?.lng 
                  ? { lat: order.cliente.lat, lng: order.cliente.lng }
                  : { lat: 0, lng: 0 }, // Se geocodificará automáticamente
              route: null,
              driver: null
              };
            })}
            city={cities.find(c => c.id.toString() === selectedCity)?.nombre || selectedCity}
            cityInfo={cities.find(c => c.id.toString() === selectedCity) ? {
              id: cities.find(c => c.id.toString() === selectedCity)!.id,
              nombre: cities.find(c => c.id.toString() === selectedCity)!.nombre,
              departamento: cities.find(c => c.id.toString() === selectedCity)!.departamento,
              direccion_operaciones: cities.find(c => c.id.toString() === selectedCity)!.direccion_operaciones
            } : undefined}
            date={selectedDate}
            driversAvailable={drivers.length}
            onRoutesGenerated={async (newRoutes) => {
              try {
                setLoading(true);
                
                // Verificar que haya repartidores disponibles
                if (drivers.length === 0) {
                  toast({
                    title: "Error",
                    description: "No hay repartidores disponibles para asignar a las rutas. Por favor, asegúrate de que haya al menos un repartidor disponible.",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Crear una ruta para cada grupo optimizado
                const routeEntries = Object.entries(newRoutes);
                let driverIndex = 0;
                let routesCreated = 0;
                let routesWithOrders = 0;
                let totalOrdersAssigned = 0;
                
                for (const [routeId, orders] of routeEntries) {
                  if (orders.length === 0) continue;
                  
                  try {
                    // Seleccionar repartidor (distribuir entre los disponibles)
                    const selectedDriver = drivers[driverIndex % drivers.length];
                    driverIndex++;
                    
                    // Crear la ruta con repartidor asignado
                    const routeResponse = await routesService.createRoute({
                      nombre_ruta: `Ruta ${routeId} - ${selectedDate}`,
                      fecha_ruta: selectedDate,
                      fkid_ciudad: parseInt(selectedCity),
                      fkid_repartidor: selectedDriver.id,
                      estado: "planificada",
                      notas: `Ruta optimizada con IA - ${orders.length} pedidos`
                    });
                    
                    // La respuesta del backend devuelve data.id directamente (el objeto ruta completo)
                    if (routeResponse.success && routeResponse.data?.id) {
                      routesCreated++;
                      const routeIdNum = parseInt(routeResponse.data.id.toString());
                      console.log(`[DEBUG] ✅ Ruta creada con ID: ${routeIdNum}`);
                      console.log(`[DEBUG] Estructura completa de respuesta:`, JSON.stringify(routeResponse, null, 2));
                      
                      // Esperar un momento para asegurar que la ruta esté completamente creada
                      await new Promise(resolve => setTimeout(resolve, 100));
                      
                      // Asignar pedidos en el orden optimizado
                      const pedidosToAssign = orders.map((order, index) => {
                        // Obtener coordenadas del pedido original desde availableOrders
                        const originalOrder = availableOrders.find(o => o.id === order.id);
                        const lat = originalOrder?.cliente?.lat || order.coordinates?.lat;
                        const lng = originalOrder?.cliente?.lng || order.coordinates?.lng;
                        
                        const pedidoData: any = {
                          fkid_pedido: parseInt(order.id),
                          orden_entrega: index + 1
                        };
                        
                        // Solo agregar lat/lng si existen y son válidos
                        if (lat !== undefined && lat !== null && lat !== 0) {
                          pedidoData.lat = parseFloat(lat.toString());
                        }
                        if (lng !== undefined && lng !== null && lng !== 0) {
                          pedidoData.lng = parseFloat(lng.toString());
                        }
                        
                        // Solo agregar link si hay coordenadas válidas
                        if (lat && lng && lat !== 0 && lng !== 0) {
                          pedidoData.link_ubicacion = `https://maps.google.com/?q=${lat},${lng}`;
                        }
                        
                        pedidoData.notas_entrega = `Orden optimizado: ${index + 1}`;
                        
                        return pedidoData;
                      });
                      
                      console.log(`[DEBUG] 📦 Preparando asignar ${pedidosToAssign.length} pedidos a ruta ${routeIdNum}`);
                      console.log(`[DEBUG] Datos de pedidos:`, JSON.stringify(pedidosToAssign, null, 2));
                      
                      // Asignar pedidos a la ruta
                      try {
                        const assignResponse = await routesService.assignOrdersToRoute(routeIdNum, {
                          pedidos: pedidosToAssign
                        });
                        
                        console.log(`[DEBUG] 📥 Respuesta del servidor:`, JSON.stringify(assignResponse, null, 2));
                        
                        if (assignResponse && assignResponse.success) {
                          routesWithOrders++;
                          totalOrdersAssigned += assignResponse.data?.pedidos_asignados || pedidosToAssign.length;
                          console.log(`✅ ✅ ✅ Pedidos asignados exitosamente a ruta ${routeIdNum}`);
                          console.log(`   - Pedidos asignados: ${assignResponse.data?.pedidos_asignados || pedidosToAssign.length}`);
                          console.log(`   - Total en ruta: ${assignResponse.data?.total_pedidos_ruta || 0}`);
                          console.log(`   - Pedidos en respuesta: ${assignResponse.data?.pedidos?.length || 0}`);
                        } else {
                          console.error(`❌ Error en respuesta de asignación:`, assignResponse);
                          const errorDetails = assignResponse?.errors || assignResponse?.message || 'Error desconocido';
                          toast({
                            title: "Error",
                            description: `No se pudieron asignar los pedidos a la ruta ${routeId}: ${typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)}`,
                            variant: "destructive"
                          });
                        }
                      } catch (assignError: any) {
                        console.error(`❌ ❌ ❌ EXCEPCIÓN al asignar pedidos:`, assignError);
                        console.error(`[DEBUG] Detalles del error:`, {
                          message: assignError?.message,
                          response: assignError?.response?.data,
                          status: assignError?.response?.status,
                          statusText: assignError?.response?.statusText
                        });
                        
                        let errorMessage = 'Error desconocido';
                        if (assignError?.response?.data) {
                          if (assignError.response.data.errors && Array.isArray(assignError.response.data.errors)) {
                            errorMessage = assignError.response.data.errors.map((e: any) => e.msg || e.message).join(', ');
                          } else if (assignError.response.data.message) {
                            errorMessage = assignError.response.data.message;
                          }
                        } else if (assignError?.message) {
                          errorMessage = assignError.message;
                        }
                          
                        toast({
                          title: "Error",
                          description: `Error al asignar pedidos a la ruta ${routeId}: ${errorMessage}`,
                          variant: "destructive"
                        });
                      }
                    } else {
                      console.error(`❌ Error creando ruta ${routeId}:`, routeResponse);
                      toast({
                        title: "Error",
                        description: `No se pudo crear la ruta ${routeId}: ${routeResponse.message || 'Error desconocido'}`,
                        variant: "destructive"
                      });
                    }
                  } catch (routeError: any) {
                    console.error(`Error procesando ruta ${routeId}:`, routeError);
                    const errorMessage = routeError?.response?.data?.message || routeError?.message || 'Error desconocido';
                    toast({
                      title: "Error",
                      description: `Error al crear la ruta ${routeId}: ${errorMessage}`,
                      variant: "destructive"
                    });
                  }
                }
                
                // Mostrar resumen
                if (routesCreated > 0) {
                  toast({
                    title: "Rutas optimizadas creadas",
                    description: `Se crearon ${routesCreated} ruta(s) y se asignaron ${totalOrdersAssigned} pedido(s) exitosamente`,
                  });
                } else {
                  toast({
                    title: "Error",
                    description: "No se pudieron crear las rutas optimizadas",
                    variant: "destructive"
                  });
                }
                
                // Recargar datos
                loadRouteData();
              } catch (error) {
                console.error('Error creando rutas optimizadas:', error);
                toast({
                  title: "Error",
                  description: "No se pudieron crear todas las rutas optimizadas",
                  variant: "destructive"
                });
              } finally {
                setLoading(false);
              }
            }}
          />
        </div>
      )}

      {/* Listado de Rutas Planificadas */}
      {routes.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Rutas Planificadas - Detalle de Entregas
            </CardTitle>
            <CardDescription>
              Listado completo de rutas planificadas con detalles de cada dirección a entregar y repartidor asignado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {routes.map((route) => (
                <div key={route.id} className="border rounded-lg p-4 space-y-4">
                  {/* Información de la Ruta */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{route.nombre_ruta}</h3>
                        <Badge variant={
                          route.estado === 'planificada' ? 'secondary' :
                          route.estado === 'en_progreso' ? 'default' :
                          route.estado === 'completada' ? 'default' : 'destructive'
                        }>
                          {route.estado === 'planificada' ? 'Planificada' :
                           route.estado === 'en_progreso' ? 'En Progreso' :
                           route.estado === 'completada' ? 'Completada' : 'Cancelada'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(route.fecha_ruta).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        {route.repartidor && (
                          <span className="flex items-center gap-1">
                            <Truck className="h-4 w-4" />
                            Repartidor: <strong className="text-foreground">{route.repartidor.nombre_completo}</strong>
                            {route.repartidor.codigo_repartidor && (
                              <span className="text-xs">({route.repartidor.codigo_repartidor})</span>
                            )}
                          </span>
                        )}
                        {route.total_pedidos > 0 && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {route.total_pedidos} {route.total_pedidos === 1 ? 'pedido' : 'pedidos'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!route.repartidor && (
                        <Badge variant="outline" className="text-warning">
                          Sin repartidor asignado
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadRoutePDF(route)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  {/* Listado de Pedidos/Entregas agrupados por fecha de envío estimada */}
                  {route.pedidos && route.pedidos.length > 0 ? (
                    <Collapsible
                      open={expandedRoutes.has(route.id)}
                      onOpenChange={() => toggleRouteExpanded(route.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-3 h-auto"
                        >
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            Direcciones a Entregar ({route.pedidos.length})
                          </h4>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              expandedRoutes.has(route.id) ? 'transform rotate-180' : ''
                            }`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-4 pt-2">
                          {(() => {
                            // Agrupar pedidos por fecha de envío estimada
                            const pedidosAgrupados = route.pedidos.reduce((acc, routeOrder) => {
                              const fechaEstimada = routeOrder.pedido?.fecha_entrega_estimada 
                                ? new Date(routeOrder.pedido.fecha_entrega_estimada).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                : 'Sin fecha estimada';
                              
                              if (!acc[fechaEstimada]) {
                                acc[fechaEstimada] = [];
                              }
                              acc[fechaEstimada].push(routeOrder);
                              return acc;
                            }, {} as { [key: string]: typeof route.pedidos });

                            // Ordenar las fechas
                            const fechasOrdenadas = Object.keys(pedidosAgrupados).sort((a, b) => {
                              if (a === 'Sin fecha estimada') return 1;
                              if (b === 'Sin fecha estimada') return -1;
                              return a.localeCompare(b);
                            });

                            return (
                              <>
                                {fechasOrdenadas.map((fechaEstimada) => (
                              <div key={fechaEstimada} className="space-y-3">
                                {/* Encabezado de fecha de envío estimada */}
                                <div className="flex items-center gap-2 pb-2 border-b">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <h5 className="font-semibold text-sm text-foreground">
                                    Fecha de Envío Estimada: {fechaEstimada}
                                  </h5>
                                  <Badge variant="outline" className="ml-auto">
                                    {pedidosAgrupados[fechaEstimada].length} {pedidosAgrupados[fechaEstimada].length === 1 ? 'pedido' : 'pedidos'}
                                  </Badge>
                                </div>
                                
                                {/* Detalle de pedidos para esta fecha */}
                                <div className="space-y-2 pl-4">
                                  {pedidosAgrupados[fechaEstimada]
                                    .sort((a, b) => (a.orden_entrega || 0) - (b.orden_entrega || 0))
                                    .map((routeOrder, index) => (
                              <div
                                key={routeOrder.id}
                                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border"
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                                  {routeOrder.orden_entrega || index + 1}
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      {routeOrder.pedido ? (
                                        <>
                                          <div className="font-medium text-sm">
                                            Pedido: {routeOrder.pedido.numero_pedido}
                                          </div>
                                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{routeOrder.pedido.direccion_entrega}</span>
                                          </div>
                                          {routeOrder.pedido.cliente && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                              Cliente: {routeOrder.pedido.cliente.nombre_completo}
                                              {routeOrder.pedido.cliente.telefono && (
                                                <span className="ml-2">• {routeOrder.pedido.cliente.telefono}</span>
                                              )}
                                            </div>
                                          )}
                                          {routeOrder.pedido.total && (
                                            <div className="text-xs font-medium mt-1">
                                              Total: ${routeOrder.pedido.total.toLocaleString('es-CO')}
                                            </div>
                                          )}
                                          {/* Indicador de productos y paquetes */}
                                          {(routeOrder.pedido.productos?.length > 0 || routeOrder.pedido.paquetes?.length > 0) && (
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                              {routeOrder.pedido.productos?.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                  <PackageIcon className="h-3 w-3" />
                                                  {routeOrder.pedido.productos.length} {routeOrder.pedido.productos.length === 1 ? 'producto' : 'productos'}
                                                </span>
                                              )}
                                              {routeOrder.pedido.paquetes?.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                  <PackageIcon className="h-3 w-3" />
                                                  {routeOrder.pedido.paquetes.length} {routeOrder.pedido.paquetes.length === 1 ? 'paquete' : 'paquetes'}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="text-sm text-muted-foreground">
                                          Pedido ID: {routeOrder.fkid_pedido}
                                        </div>
                                      )}
                                    </div>
                                    <Badge
                                      variant={
                                        routeOrder.estado_entrega === 'entregado' ? 'default' :
                                        routeOrder.estado_entrega === 'en_camino' ? 'default' :
                                        routeOrder.estado_entrega === 'fallido' ? 'destructive' : 'secondary'
                                      }
                                      className="text-xs"
                                    >
                                      {routeOrder.estado_entrega === 'pendiente' ? 'Pendiente' :
                                       routeOrder.estado_entrega === 'en_camino' ? 'En Camino' :
                                       routeOrder.estado_entrega === 'entregado' ? 'Entregado' : 'Fallido'}
                                    </Badge>
                                  </div>

                                  {/* Detalle del Pedido - Productos y Paquetes */}
                                  {routeOrder.pedido && (
                                    <Collapsible
                                      open={expandedOrderDetails.has(routeOrder.id)}
                                      onOpenChange={() => {
                                        setExpandedOrderDetails(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(routeOrder.id)) {
                                            newSet.delete(routeOrder.id);
                                          } else {
                                            newSet.add(routeOrder.id);
                                          }
                                          return newSet;
                                        });
                                      }}
                                    >
                                      <CollapsibleTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-auto py-1 px-2 text-xs w-full justify-between"
                                        >
                                          <span className="text-xs">Ver detalle del pedido</span>
                                          <ChevronDown
                                            className={`h-3 w-3 transition-transform ${
                                              expandedOrderDetails.has(routeOrder.id) ? 'transform rotate-180' : ''
                                            }`}
                                          />
                                        </Button>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent className="mt-2 space-y-2">
                                        {/* Productos */}
                                        {routeOrder.pedido.productos && routeOrder.pedido.productos.length > 0 ? (
                                          <div className="bg-background/50 rounded-md p-2 border">
                                            <div className="text-xs font-medium mb-2 text-muted-foreground uppercase">Productos ({routeOrder.pedido.productos.length}):</div>
                                            <div className="space-y-2">
                                              {routeOrder.pedido.productos.map((producto: any) => (
                                                <div key={producto.id} className="text-xs p-2 bg-muted/30 rounded border-l-2 border-l-primary">
                                                  <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                      <div className="font-medium">{producto.producto?.nombre || 'Producto'}</div>
                                                      {producto.producto?.descripcion && (
                                                        <div className="text-muted-foreground mt-0.5 text-[10px]">{producto.producto.descripcion}</div>
                                                      )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 text-muted-foreground">
                                                      <div className="flex items-center gap-1">
                                                        <span className="font-medium">Cant:</span>
                                                        <span>{producto.cantidad}</span>
                                                      </div>
                                                      <div className="flex items-center gap-1">
                                                        <span className="font-medium">Precio:</span>
                                                        <span>${producto.precio_unidad?.toLocaleString('es-CO') || '0'}</span>
                                                      </div>
                                                      {producto.descuento_producto > 0 && (
                                                        <div className="text-green-600 font-medium">
                                                          Descuento: -{producto.descuento_producto}%
                                                        </div>
                                                      )}
                                                      {producto.notas_producto && (
                                                        <div className="text-[10px] italic text-muted-foreground mt-1">
                                                          {producto.notas_producto}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-muted-foreground italic">No hay productos en este pedido</div>
                                        )}

                                        {/* Paquetes */}
                                        {routeOrder.pedido.paquetes && routeOrder.pedido.paquetes.length > 0 ? (
                                          <div className="bg-background/50 rounded-md p-2 border">
                                            <div className="text-xs font-medium mb-2 text-muted-foreground uppercase">Paquetes ({routeOrder.pedido.paquetes.length}):</div>
                                            <div className="space-y-2">
                                              {routeOrder.pedido.paquetes.map((paquete: any) => (
                                                <div key={paquete.id} className="text-xs p-2 bg-muted/30 rounded border-l-2 border-l-blue-500">
                                                  <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                      <div className="font-medium">{paquete.paquete?.nombre || 'Paquete'}</div>
                                                      {paquete.paquete?.descripcion && (
                                                        <div className="text-muted-foreground mt-0.5 text-[10px]">{paquete.paquete.descripcion}</div>
                                                      )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 text-muted-foreground">
                                                      <div className="flex items-center gap-1">
                                                        <span className="font-medium">Cant:</span>
                                                        <span>{paquete.cantidad}</span>
                                                      </div>
                                                      <div className="flex items-center gap-1">
                                                        <span className="font-medium">Precio:</span>
                                                        <span>${paquete.precio_unidad?.toLocaleString('es-CO') || paquete.paquete?.precio_final?.toLocaleString('es-CO') || '0'}</span>
                                                      </div>
                                                      {paquete.descuento_paquete > 0 && (
                                                        <div className="text-green-600 font-medium">
                                                          Descuento: -{paquete.descuento_paquete}%
                                                        </div>
                                                      )}
                                                      {paquete.notas_paquete && (
                                                        <div className="text-[10px] italic text-muted-foreground mt-1">
                                                          {paquete.notas_paquete}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-muted-foreground italic">No hay paquetes en este pedido</div>
                                        )}

                                        {/* Mensaje si no hay ni productos ni paquetes */}
                                        {(!routeOrder.pedido.productos || routeOrder.pedido.productos.length === 0) &&
                                         (!routeOrder.pedido.paquetes || routeOrder.pedido.paquetes.length === 0) && (
                                          <div className="text-xs text-center text-muted-foreground py-2 italic">
                                            Este pedido no tiene productos ni paquetes asignados
                                          </div>
                                        )}

                                        {/* Información adicional del pedido */}
                                        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                                          {routeOrder.pedido.metodo_pago && (
                                            <div>Método de pago: <span className="font-medium capitalize">{routeOrder.pedido.metodo_pago}</span></div>
                                          )}
                                          {routeOrder.pedido.telefono_referencia && (
                                            <div>Teléfono referencia: {routeOrder.pedido.telefono_referencia}</div>
                                          )}
                                          {routeOrder.pedido.email_referencia && (
                                            <div>Email referencia: {routeOrder.pedido.email_referencia}</div>
                                          )}
                                          {routeOrder.pedido.notas && (
                                            <div className="italic">Notas del pedido: {routeOrder.pedido.notas}</div>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )}

                                  {routeOrder.notas_entrega && (
                                    <div className="text-xs text-muted-foreground mt-1 italic">
                                      Notas de entrega: {routeOrder.notas_entrega}
                                    </div>
                                  )}
                                  {routeOrder.link_ubicacion && (
                                    <a
                                      href={routeOrder.link_ubicacion}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                    >
                                      <Navigation className="h-3 w-3" />
                                      Ver en mapa
                                    </a>
                                  )}
                                </div>
                              </div>
                                    ))}
                                </div>
                              </div>
                                ))}
                              </>
                            );
                          })()}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <div className="text-center text-muted-foreground py-4 border rounded-lg">
                      No hay pedidos asignados a esta ruta
                    </div>
                  )}

                  {/* Estadísticas de la Ruta */}
                  {(route.distancia_estimada || route.tiempo_estimado) && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                      {route.distancia_estimada != null && typeof route.distancia_estimada === 'number' && (
                        <span>Distancia estimada: {route.distancia_estimada.toFixed(2)} km</span>
                      )}
                      {route.tiempo_estimado != null && typeof route.tiempo_estimado === 'number' && (
                        <span>Tiempo estimado: {Math.round(route.tiempo_estimado)} min</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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