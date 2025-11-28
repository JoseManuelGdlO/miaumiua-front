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
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Package, 
  Loader2,
  Eye,
  DollarSign,
  CheckCircle,
  XCircle,
  Tag
} from "lucide-react";
import { 
  canCreate, 
  canEdit, 
  canDelete
} from "@/utils/permissions";
import { useToast } from "@/hooks/use-toast";
import { packagesService, Package as PackageType } from "@/services/packagesService";
import CreatePackageModal from "@/components/modals/CreatePackageModal";

const Packages = () => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPackages, setTotalPackages] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  const itemsPerPage = 10;

  // Cargar paquetes al montar el componente
  useEffect(() => {
    loadPackages();
  }, [currentPage, searchTerm]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await packagesService.getAllPackages({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined
        // No filtrar por activos, mostrar todos
      });
      
      if (response.success) {
        setPackages(response.data.paquetes);
        setTotalPages(response.data.pagination.totalPages);
        setTotalPackages(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
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

  const handleViewDetails = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setIsDetailsModalOpen(true);
  };

  const handleDeletePackage = async (packageId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este paquete?')) {
      return;
    }

    try {
      await packagesService.deletePackage(packageId);
      toast({
        title: "Paquete eliminado",
        description: "El paquete ha sido eliminado correctamente",
      });
      loadPackages();
    } catch (error) {
      console.error('Error al eliminar paquete:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el paquete",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (pkg: PackageType) => {
    try {
      await packagesService.togglePackageStatus(pkg.id, !pkg.is_active);
      toast({
        title: "Estado actualizado",
        description: `El paquete ha sido ${!pkg.is_active ? 'activado' : 'desactivado'}`,
      });
      loadPackages();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del paquete",
        variant: "destructive"
      });
    }
  };

  const handleEditPackage = async (pkg: PackageType) => {
    try {
      // Cargar el paquete completo con sus productos
      const response = await packagesService.getPackageById(pkg.id);
      if (response.success) {
        setEditingPackage(response.data.paquete);
        setIsCreateModalOpen(true);
      }
    } catch (error) {
      console.error('Error al cargar paquete:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el paquete para editar",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paquetes</h1>
          <p className="text-muted-foreground">
            Gestiona los paquetes de productos del sistema
          </p>
        </div>
        {canCreate('packages') && (
          <Button onClick={() => {
            setEditingPackage(null);
            setIsCreateModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Paquete
          </Button>
        )}
      </div>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Paquetes Registrados</CardTitle>
          <CardDescription>
            Lista completa de paquetes con filtros y búsqueda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de paquete..."
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
                  <TableHead>Paquete</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando paquetes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron paquetes
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <div className="font-medium">{pkg.nombre}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {pkg.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-[200px] truncate">
                          {pkg.descripcion || 'Sin descripción'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {pkg.productos?.length || 0} productos
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(pkg.precio)}</div>
                      </TableCell>
                      <TableCell>
                        {pkg.descuento && pkg.descuento > 0 ? (
                          <div className="text-green-600 font-medium">
                            -{formatCurrency(pkg.descuento)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">{formatCurrency(pkg.precio_final)}</div>
                      </TableCell>
                      <TableCell>
                        {pkg.is_active ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(pkg.created_at)}
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
                            <DropdownMenuItem onClick={() => handleViewDetails(pkg)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            {canEdit('packages') && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditPackage(pkg)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(pkg)}>
                                  {pkg.is_active ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Desactivar
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Activar
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete('packages') && (
                              <DropdownMenuItem 
                                onClick={() => handleDeletePackage(pkg.id)}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalPackages)} de {totalPackages} paquetes
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
      <CreatePackageModal 
        open={isCreateModalOpen} 
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            setEditingPackage(null);
          }
        }} 
        onPackageCreated={() => {
          loadPackages();
          setEditingPackage(null);
        }}
        editingPackage={editingPackage}
      />
      
      {/* Package Details Modal */}
      {selectedPackage && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {selectedPackage.nombre}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Package Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Información del Paquete</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {selectedPackage.id}</p>
                    <p><strong>Nombre:</strong> {selectedPackage.nombre}</p>
                    <p><strong>Estado:</strong> 
                      {selectedPackage.is_active ? (
                        <Badge variant="default" className="ml-2">Activo</Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-2">Inactivo</Badge>
                      )}
                    </p>
                    <p><strong>Fecha de Creación:</strong> {formatDate(selectedPackage.created_at)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Precios</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Precio Base:</strong> {formatCurrency(selectedPackage.precio)}</p>
                    {selectedPackage.descuento && selectedPackage.descuento > 0 && (
                      <p><strong>Descuento:</strong> 
                        <span className="text-green-600 ml-2">-{formatCurrency(selectedPackage.descuento)}</span>
                      </p>
                    )}
                    <p><strong>Precio Final:</strong> 
                      <span className="font-bold text-lg ml-2">{formatCurrency(selectedPackage.precio_final)}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {selectedPackage.descripcion && (
                <div>
                  <h4 className="font-semibold mb-2">Descripción</h4>
                  <p className="text-sm text-muted-foreground">{selectedPackage.descripcion}</p>
                </div>
              )}
              
              {/* Products */}
              <div>
                <h4 className="font-semibold mb-2">Productos Incluidos</h4>
                {selectedPackage.productos && selectedPackage.productos.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPackage.productos.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{product.producto?.nombre || `Producto ID: ${product.fkid_producto}`}</p>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {product.cantidad}
                            {product.producto?.precio_venta && (
                              <> | Precio Unitario: {formatCurrency(product.producto.precio_venta)}</>
                            )}
                          </p>
                          {product.producto?.descripcion && (
                            <p className="text-xs text-muted-foreground mt-1">{product.producto.descripcion}</p>
                          )}
                        </div>
                        {product.producto?.precio_venta && (
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(product.producto.precio_venta * product.cantidad)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay productos asociados</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Packages;

