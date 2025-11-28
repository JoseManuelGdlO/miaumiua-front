import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Users
} from "lucide-react";
import { 
  canCreate, 
  canEdit, 
  canDelete, 
  canChangeOrderStatus, 
  canConfirmOrder, 
  canDeliverOrder, 
  canCancelOrder,
  canViewStats 
} from "@/utils/permissions";
import { useToast } from "@/hooks/use-toast";
import { ordersService, Order, OrderStatsResponse } from "@/services/ordersService";
import { clientesService } from "@/services/clientesService";
import { citiesService } from "@/services/citiesService";
import CreateOrderModal from "@/components/modals/CreateOrderModal";
import EditOrderModal from "@/components/modals/EditOrderModal";

// Extend the Order interface to match API response
interface OrderWithAPI extends Order {
  cliente?: {
    id: number;
    nombre_completo: string;
    telefono: string;
    email?: string;
  };
  ciudad?: {
    id: number;
    nombre: string;
    departamento: string;
  };
}

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderWithAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStatsResponse['data'] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithAPI | null>(null);
  const itemsPerPage = 10;

  // Cargar pedidos y estadísticas al montar el componente
  useEffect(() => {
    loadOrders();
    loadStats();
  }, [currentPage, searchTerm, statusFilter, paymentMethodFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersService.getAllOrders({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        estado: statusFilter === 'all' ? undefined : statusFilter as any,
        metodo_pago: paymentMethodFilter === 'all' ? undefined : paymentMethodFilter as any,
        activos: 'true'
      });
      
      if (response.success) {
        setOrders(response.data.pedidos);
        setTotalPages(response.data.pagination.totalPages);
        setTotalOrders(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await ordersService.getOrderStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePaymentMethodFilter = (value: string) => {
    setPaymentMethodFilter(value);
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const handleViewDetails = async (order: OrderWithAPI) => {
    try {
      // Cargar los datos completos del pedido desde el backend
      const response = await ordersService.getOrderById(order.id);
      if (response.success) {
        setSelectedOrder(response.data.pedido as OrderWithAPI);
        setIsDetailsModalOpen(true);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del pedido",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del pedido",
        variant: "destructive"
      });
    }
  };

  const handleEditOrder = async (order: OrderWithAPI) => {
    try {
      // Cargar los datos completos del pedido desde el backend
      const response = await ordersService.getOrderById(order.id);
      if (response.success) {
        setSelectedOrder(response.data.pedido as OrderWithAPI);
        setIsEditModalOpen(true);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del pedido",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del pedido",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', variant: 'secondary' as const, icon: Clock },
      confirmado: { label: 'Confirmado', variant: 'default' as const, icon: CheckCircle },
      en_preparacion: { label: 'En Preparación', variant: 'default' as const, icon: Package },
      en_camino: { label: 'En Camino', variant: 'default' as const, icon: Truck },
      entregado: { label: 'Entregado', variant: 'default' as const, icon: CheckCircle },
      cancelado: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      efectivo: { label: 'Efectivo', variant: 'secondary' as const },
      tarjeta: { label: 'Tarjeta', variant: 'default' as const },
      transferencia: { label: 'Transferencia', variant: 'default' as const },
      pago_movil: { label: 'Pago Móvil', variant: 'default' as const }
    };

    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.efectivo;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await ordersService.changeOrderStatus(orderId, newStatus);
      toast({
        title: "Estado actualizado",
        description: `El pedido ha sido marcado como ${newStatus}`,
      });
      loadOrders();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del pedido",
        variant: "destructive"
      });
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      await ordersService.deleteOrder(orderId);
      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado correctamente",
      });
      loadOrders();
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los pedidos del sistema
          </p>
        </div>
        {canCreate('orders') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Pedido
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_pedidos || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pedidos_pendientes || 0} pendientes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_ventas || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: {formatCurrency(stats.promedio_pedido || 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.ventas_mes_actual || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.crecimiento_ventas && stats.crecimiento_ventas > 0 ? '+' : ''}{stats.crecimiento_ventas?.toFixed(1) || '0.0'}% vs mes anterior
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pedidos_entregados || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pedidos_en_camino || 0} en camino
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Registrados</CardTitle>
          <CardDescription>
            Lista completa de pedidos con filtros y búsqueda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de pedido..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="en_preparacion">En Preparación</SelectItem>
                <SelectItem value="en_camino">En Camino</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentMethodFilter} onValueChange={handlePaymentMethodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="pago_movil">Pago Móvil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método Pago</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando pedidos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron pedidos
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                    <TableCell>
                        <div className="font-medium">#{order.numero_pedido}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {order.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                          <div className="font-medium">{order.cliente?.nombre_completo}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.cliente?.telefono}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{order.ciudad?.nombre}</div>
                          <div className="text-muted-foreground max-w-[200px] truncate">
                            {order.direccion_entrega}
                          </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        {getStatusBadge(order.estado)}
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodBadge(order.metodo_pago)}
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{formatCurrency(order.total)}</div>
                        {order.descuento_total > 0 && (
                          <div className="text-xs text-green-600">
                            -{formatCurrency(order.descuento_total)} desc.
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(order.created_at)}</div>
                          {order.fecha_entrega_estimada && (
                            <div className="text-muted-foreground">
                              Entrega: {formatDate(order.fecha_entrega_estimada)}
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
                            <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                            {canEdit('orders') && (
                              <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canConfirmOrder() && order.estado === 'pendiente' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'confirmado')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {canChangeOrderStatus() && order.estado === 'confirmado' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'en_preparacion')}>
                                <Package className="mr-2 h-4 w-4" />
                                En Preparación
                              </DropdownMenuItem>
                            )}
                            {canChangeOrderStatus() && order.estado === 'en_preparacion' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'en_camino')}>
                                <Truck className="mr-2 h-4 w-4" />
                                En Camino
                              </DropdownMenuItem>
                            )}
                            {canDeliverOrder() && order.estado === 'en_camino' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'entregado')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar Entregado
                              </DropdownMenuItem>
                            )}
                            {canCancelOrder() && order.estado !== 'cancelado' && order.estado !== 'entregado' && (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(order.id, 'cancelado')}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancelar
                              </DropdownMenuItem>
                            )}
                            {canDelete('orders') && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteOrder(order.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalOrders)} de {totalOrders} pedidos
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                          onClick={() => setCurrentPage(page)}
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
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateOrderModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
        onOrderCreated={loadOrders}
      />
      
      {/* Order Details Modal */}
      {selectedOrder && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalles del Pedido #{selectedOrder.numero_pedido}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Información del Pedido</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Número:</strong> {selectedOrder.numero_pedido}</p>
                    <p><strong>Estado:</strong> {getStatusBadge(selectedOrder.estado)}</p>
                    <p><strong>Fecha:</strong> {formatDate(selectedOrder.created_at)}</p>
                    <p><strong>Método de Pago:</strong> {selectedOrder.metodo_pago}</p>
                    <p><strong>Total:</strong> {formatCurrency(selectedOrder.total)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Cliente</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nombre:</strong> {selectedOrder.cliente?.nombre_completo || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> {selectedOrder.telefono_referencia || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedOrder.email_referencia || 'N/A'}</p>
                    <p><strong>Ciudad:</strong> {selectedOrder.ciudad?.nombre || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Delivery Info */}
              <div>
                <h4 className="font-semibold mb-2">Información de Entrega</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Dirección:</strong> {selectedOrder.direccion_entrega}</p>
                  <p><strong>Fecha Estimada:</strong> {formatDate(selectedOrder.fecha_entrega_estimada)}</p>
                  {selectedOrder.notas && (
                    <p><strong>Notas:</strong> {selectedOrder.notas}</p>
                  )}
                </div>
              </div>
              
              {/* Products */}
              {selectedOrder.productos && selectedOrder.productos.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Productos</h4>
                  <div className="space-y-2">
                    {selectedOrder.productos.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{product.producto?.nombre || 'Producto'}</p>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {product.cantidad} | Precio: {formatCurrency(product.precio_unidad)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(product.cantidad * product.precio_unidad)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages */}
              {selectedOrder.paquetes && selectedOrder.paquetes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Paquetes</h4>
                  <div className="space-y-2">
                    {selectedOrder.paquetes.map((pkg, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{pkg.paquete?.nombre || 'Paquete'}</p>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {pkg.cantidad} | Precio: {formatCurrency(pkg.precio_unidad)}
                            {pkg.paquete?.descripcion && (
                              <span className="block mt-1">{pkg.paquete.descripcion}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(pkg.precio_total || (pkg.cantidad * pkg.precio_unidad))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show message if no products or packages */}
              {(!selectedOrder.productos || selectedOrder.productos.length === 0) && 
               (!selectedOrder.paquetes || selectedOrder.paquetes.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No hay productos ni paquetes en este pedido</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Order Modal */}
      {selectedOrder && (
        <EditOrderModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        order={selectedOrder}
          onOrderUpdated={loadOrders}
      />
      )}
    </div>
  );
};

export default Orders;