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
  PaginationEllipsis,
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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Package, Package2, Loader2, AlertTriangle } from "lucide-react";
import { canCreate, canEdit, canDelete } from "@/utils/permissions";
import CreateInventarioModal from "@/components/modals/CreateInventarioModal";
import EditInventarioModal from "@/components/modals/EditInventarioModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { inventariosService, Inventario } from "@/services/inventariosService";
import { useToast } from "@/hooks/use-toast";

const Inventarios = () => {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInventario, setSelectedInventario] = useState<Inventario | null>(null);
  const itemsPerPage = 8;
  const { toast } = useToast();

  // Cargar inventarios
  const loadInventarios = async () => {
    try {
      setLoading(true);
      const response = await inventariosService.getAllInventarios({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        activos: 'true'
      });

      setInventarios(response.data.inventarios);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
    } catch (error) {
      console.error('Error al cargar inventarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los inventarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventarios();
  }, [currentPage, searchTerm]);

  // Manejar búsqueda
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Manejar eliminación
  const handleDelete = async () => {
    if (!selectedInventario) return;

    try {
      await inventariosService.deleteInventario(selectedInventario.id);
      toast({
        title: "Éxito",
        description: "Inventario eliminado correctamente",
      });
      loadInventarios();
    } catch (error) {
      console.error('Error al eliminar inventario:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el inventario",
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedInventario(null);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Obtener estado del stock
  const getStockStatus = (inventario: Inventario) => {
    if (inventario.stock_inicial <= inventario.stock_minimo) {
      return { status: "Stock Bajo", variant: "destructive" as const };
    } else if (inventario.stock_inicial <= inventario.stock_minimo * 1.5) {
      return { status: "Stock Medio", variant: "secondary" as const };
    } else {
      return { status: "Stock Alto", variant: "default" as const };
    }
  };

  // Calcular inventarios con stock bajo
  const lowStockCount = inventarios.filter(inv => inv.stock_inicial <= inv.stock_minimo).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventarios</h1>
          <p className="text-muted-foreground">
            Gestiona el inventario de productos disponibles
          </p>
        </div>
        {canCreate('inventory') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventarios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(inventarios.reduce((sum, inv) => sum + (inv.precio_venta * inv.stock_inicial), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Inventarios</CardTitle>
          <CardDescription>
            Lista de todos los productos en inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, SKU o descripción..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando inventarios...
                    </TableCell>
                  </TableRow>
                ) : inventarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No se encontraron inventarios
                    </TableCell>
                  </TableRow>
                ) : (
                  inventarios.map((inventario) => {
                    const stockStatus = getStockStatus(inventario);
                    return (
                      <TableRow key={inventario.id}>
                        <TableCell className="font-mono text-sm">
                          {inventario.sku}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{inventario.nombre}</div>
                            {inventario.descripcion && (
                              <div className="text-sm text-muted-foreground">
                                {inventario.descripcion}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {inventario.categoria?.nombre || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Actual: {inventario.stock_inicial}</div>
                            <div className="text-muted-foreground">
                              Mín: {inventario.stock_minimo}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Venta: {formatPrice(inventario.precio_venta)}</div>
                            <div className="text-muted-foreground">
                              Costo: {formatPrice(inventario.costo_unitario)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {inventario.ciudad?.nombre || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {inventario.proveedor?.nombre || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(inventario.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEdit('inventory') && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInventario(inventario);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canDelete('inventory') && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInventario(inventario);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} inventarios
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
                  
                  {totalPages > 5 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
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
      <CreateInventarioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadInventarios}
      />

      {selectedInventario && (
        <EditInventarioModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedInventario(null);
          }}
          onSuccess={loadInventarios}
          inventario={selectedInventario}
        />
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedInventario(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Inventario"
        description={`¿Estás seguro de que quieres eliminar el inventario "${selectedInventario?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default Inventarios;
