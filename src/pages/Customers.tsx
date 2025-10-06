import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, MoreHorizontal, Edit, Trash2, UserCheck, Star, MessageSquare, Phone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clientesService, Cliente } from "@/services/clientesService";
import CreateCustomerModal from "@/components/modals/CreateCustomerModal";

// Extend the Cliente interface to match API response
interface ClienteWithAPI extends Cliente {
  is_active: boolean;
  created_at: string;
  updated_at: string;
  totalPedidos?: number;
  ultimoPedido?: string | null;
  totalGastado?: number;
  loyaltyPoints?: number;
  mascotas?: Array<{
    id: number;
    nombre: string;
    edad?: number;
    genero?: string;
    raza?: string;
  }>;
}
import EditCustomerModal from "@/components/modals/EditCustomerModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

const Customers = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<ClienteWithAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);
  const itemsPerPage = 10;

  // Cargar clientes al montar el componente
  useEffect(() => {
    loadClientes();
  }, [currentPage, searchTerm]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const response = await clientesService.getAllClientes({
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage
      });
      
      if (response.success) {
        setClientes(response.data.clientes);
        setTotalPages(response.data.pagination.totalPages);
        setTotalClientes(response.data.pagination.total);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar los clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCliente = async () => {
    if (!selectedCliente) return;
    
    try {
      const response = await clientesService.deleteCliente(selectedCliente.id);
      if (response.success) {
        toast({
          title: "Cliente eliminado",
          description: "El cliente ha sido eliminado exitosamente",
        });
        loadClientes(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el cliente",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsDeleteModalOpen(true);
  };

  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsEditModalOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset a la primera página al buscar
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground">
            Base de datos de clientes Miau Miau y programa de lealtad
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <UserCheck className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Registrados</CardTitle>
          <CardDescription>
            Información completa de clientes, historial de compras y programa de lealtad
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Clientes Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Total Gastado</TableHead>
                  <TableHead>Puntos</TableHead>
                  <TableHead>Último Pedido</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando clientes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{cliente.nombre_completo}</div>
                            <div className="text-sm text-muted-foreground">
                              Registrado: {formatDate(cliente.created_at)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{cliente.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{cliente.ciudad.nombre}</div>
                          <div className="text-muted-foreground">{cliente.ciudad.departamento}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{cliente.totalPedidos}</div>
                          <div className="text-xs text-muted-foreground">pedidos</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(cliente.totalGastado)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm font-medium">{cliente.loyaltyPoints}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cliente.ultimoPedido ? formatDate(cliente.ultimoPedido) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCliente(cliente)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Cliente
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteClick(cliente)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
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
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalClientes)} de {totalClientes} clientes
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
            <div>
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center space-x-4">
              <span>Total clientes: {totalClientes}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateCustomerModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onClienteCreated={loadClientes}
      />

      <EditCustomerModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        cliente={selectedCliente}
        onClienteUpdated={loadClientes}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteCliente}
        itemName={selectedCliente?.nombre_completo}
        itemType="cliente"
        title="Eliminar Cliente"
        description={`¿Estás seguro de que deseas eliminar al cliente "${selectedCliente?.nombre_completo}"? Esta acción no se puede deshacer y el cliente perderá acceso al sistema.`}
      />
    </div>
  );
};

export default Customers;