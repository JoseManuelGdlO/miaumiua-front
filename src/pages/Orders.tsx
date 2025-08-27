import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Edit, Eye, Truck, MapPin, Package2 } from "lucide-react";
import CreateOrderModal from "@/components/modals/CreateOrderModal";
import ReScheduleOrderModal from "@/components/modals/ReScheduleOrderModal";

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReScheduleModalOpen, setIsReScheduleModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const itemsPerPage = 12;
  
  const orders = [
    {
      id: 1,
      orderNumber: "MM-2024-0001",
      customer: "María González",
      phone: "+57 320 123 4567",
      address: "Calle 127 #15-45, Apto 502",
      city: "Bogotá",
      zone: "Zona Norte",
      products: [
        { name: "Arena Premium 10kg", quantity: 2, price: 45000 }
      ],
      total: 90000,
      status: "Pendiente",
      orderDate: "2024-01-15",
      deliveryDate: "2024-01-16",
      paymentMethod: "Efectivo",
      deliveryRoute: null,
      driver: null,
      coordinates: { lat: 4.7110, lng: -74.0721 }
    },
    {
      id: 2,
      orderNumber: "MM-2024-0002",
      customer: "Carlos Ramírez",
      phone: "+57 315 987 6543", 
      address: "Carrera 70 #45-12, Casa 15",
      city: "Medellín",
      zone: "El Poblado",
      products: [
        { name: "Arena Antibacterial 5kg", quantity: 3, price: 28000 }
      ],
      total: 84000,
      status: "En Ruta",
      orderDate: "2024-01-14",
      deliveryDate: "2024-01-15",
      paymentMethod: "Tarjeta",
      deliveryRoute: "Ruta A",
      driver: "Juan Pérez",
      coordinates: { lat: 6.2442, lng: -75.5812 }
    },
    {
      id: 3,
      orderNumber: "MM-2024-0003",
      customer: "Laura Martínez",
      phone: "+57 301 456 7890",
      address: "Avenida 6N #28-15, Torre 3",
      city: "Cali",
      zone: "Norte",
      products: [
        { name: "Arena Perfumada 15kg", quantity: 1, price: 52000 },
        { name: "Arena Básica 8kg", quantity: 2, price: 18000 }
      ],
      total: 88000,
      status: "Entregado",
      orderDate: "2024-01-13",
      deliveryDate: "2024-01-14",
      paymentMethod: "Transferencia",
      deliveryRoute: "Ruta B",
      driver: "Ana López",
      coordinates: { lat: 3.4516, lng: -76.5320 }
    },
    {
      id: 4,
      orderNumber: "MM-2024-0004",
      customer: "Andrés Torres",
      phone: "+57 304 234 5678",
      address: "Calle 84 #51-20, Local 8",
      city: "Barranquilla",
      zone: "Riomar",
      products: [
        { name: "Arena Básica 8kg", quantity: 4, price: 18000 }
      ],
      total: 72000,
      status: "Cancelado",
      orderDate: "2024-01-12",
      deliveryDate: "2024-01-13",
      paymentMethod: "Efectivo",
      deliveryRoute: null,
      driver: null,
      coordinates: { lat: 10.9685, lng: -74.7813 }
    },
    {
      id: 5,
      orderNumber: "MM-2024-0005",
      customer: "Patricia Herrera",
      phone: "+57 318 345 6789",
      address: "Bocagrande, Calle 5 #4-32",
      city: "Cartagena", 
      zone: "Bocagrande",
      products: [
        { name: "Arena Ultra 12kg", quantity: 1, price: 58000 }
      ],
      total: 58000,
      status: "Programado",
      orderDate: "2024-01-15",
      deliveryDate: "2024-01-17",
      paymentMethod: "Tarjeta",
      deliveryRoute: null,
      driver: null,
      coordinates: { lat: 10.3932, lng: -75.4832 }
    },
    // Generar más pedidos para paginación
    ...Array.from({ length: 45 }, (_, i) => {
      const customers = ['Roberto Silva', 'Carmen Vega', 'Diego Morales', 'Elena Ruiz', 'Fernando Castro'];
      const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'];
      const zones = {
        'Bogotá': ['Norte', 'Sur', 'Centro', 'Chapinero'],
        'Medellín': ['El Poblado', 'Envigado', 'Centro', 'Laureles'],
        'Cali': ['Norte', 'Sur', 'Centro', 'Oeste'],
        'Barranquilla': ['Riomar', 'Centro', 'Norte', 'Atlántico'],
        'Cartagena': ['Bocagrande', 'Centro', 'Manga', 'Pie de la Popa'],
        'Bucaramanga': ['Cabecera', 'Centro', 'Norte', 'Cañaveral']
      };
      const products = ['Arena Premium 10kg', 'Arena Antibacterial 5kg', 'Arena Perfumada 15kg', 'Arena Básica 8kg'];
      const statuses = ['Pendiente', 'En Ruta', 'Entregado', 'Programado'];
      const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia'];
      
      const city = cities[i % cities.length];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const product = products[i % products.length];
      const price = Math.floor(Math.random() * 40000) + 15000;
      
      return {
        id: 6 + i,
        orderNumber: `MM-2024-${String(6 + i).padStart(4, '0')}`,
        customer: customers[i % customers.length],
        phone: `+57 ${300 + Math.floor(Math.random() * 20)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
        address: `Dirección ${i + 1}, Ciudad ${city}`,
        city,
        zone: zones[city as keyof typeof zones][i % zones[city as keyof typeof zones].length],
        products: [{ name: product, quantity, price }],
        total: quantity * price,
        status: statuses[i % statuses.length],
        orderDate: "2024-01-15",
        deliveryDate: "2024-01-16",
        paymentMethod: paymentMethods[i % paymentMethods.length],
        deliveryRoute: Math.random() > 0.6 ? `Ruta ${String.fromCharCode(65 + (i % 5))}` : null,
        driver: Math.random() > 0.6 ? `Conductor ${i % 5 + 1}` : null,
        coordinates: { lat: Math.random() * 10 + 3, lng: Math.random() * 10 - 80 }
      };
    })
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "Pendiente": "bg-warning text-warning-foreground",
      "En Ruta": "bg-primary text-primary-foreground", 
      "Entregado": "bg-success text-success-foreground",
      "Programado": "bg-secondary text-secondary-foreground",
      "Cancelado": "bg-destructive text-destructive-foreground"
    };
    return <Badge className={statusColors[status as keyof typeof statusColors]}>{status}</Badge>;
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleReSchedule = (order: any) => {
    const orderForReSchedule = {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      phone: order.phone,
      address: order.address,
      city: order.city,
      zone: order.zone,
      products: order.products,
      total: order.total,
      originalDate: order.deliveryDate,
      cancelReason: "Pedido cancelado previamente"
    };
    setSelectedOrder(orderForReSchedule);
    setIsReScheduleModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">
            Todos los pedidos realizados y su estado de entrega
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Package2 className="h-4 w-4" />
          Nuevo Pedido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Miau Miau</CardTitle>
          <CardDescription>
            Historial completo de pedidos con información de entrega y seguimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedidos por número, cliente, ciudad o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{order.orderNumber}</div>
                        <div className="text-sm text-muted-foreground">{order.orderDate}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{order.customer}</div>
                        <div className="text-sm text-muted-foreground">{order.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {order.city}
                        </div>
                        <div className="text-sm text-muted-foreground max-w-xs">
                          {order.address}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.zone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.products.map((product, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{product.quantity}x</span> {product.name}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.total.toLocaleString('es-CO')}
                      <div className="text-xs text-muted-foreground mt-1">
                        {order.paymentMethod}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{order.deliveryDate}</div>
                        {order.deliveryRoute && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Truck className="h-3 w-3" />
                            {order.deliveryRoute}
                          </div>
                        )}
                        {order.driver && (
                          <div className="text-xs text-muted-foreground">
                            {order.driver}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Pedido
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Truck className="mr-2 h-4 w-4" />
                            Asignar Ruta
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MapPin className="mr-2 h-4 w-4" />
                            Ver en Mapa
                          </DropdownMenuItem>
                          {order.status === "Cancelado" && (
                            <DropdownMenuItem onClick={() => handleReSchedule(order)}>
                              <Package2 className="mr-2 h-4 w-4" />
                              Reagendar Pedido
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredOrders.length)} de {filteredOrders.length} pedidos
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <CreateOrderModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />

      <ReScheduleOrderModal
        open={isReScheduleModalOpen}
        onOpenChange={setIsReScheduleModalOpen}
        order={selectedOrder}
      />
    </div>
  );
};

export default Orders;