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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { categoriasProductoService, CategoriaProducto } from "@/services/categoriasProductoService";
import CreateCategoriaProductoModal from "@/components/modals/CreateCategoriaProductoModal";
import EditCategoriaProductoModal from "@/components/modals/EditCategoriaProductoModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

const CategoriasProducto = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaProducto | null>(null);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategorias, setTotalCategorias] = useState(0);
  const itemsPerPage = 8;

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategorias();
  }, [currentPage, searchTerm]);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const response = await categoriasProductoService.getAllCategorias({
        activos: 'true',
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage
      });
      
      if (response.success) {
        setCategorias(response.data.categorias);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCategorias(response.data.pagination.total);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías de producto",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar las categorías de producto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategoria = async () => {
    if (!selectedCategoria) return;
    
    try {
      const response = await categoriasProductoService.deleteCategoria(selectedCategoria.id);
      if (response.success) {
        toast({
          title: "Categoría eliminada",
          description: "La categoría ha sido eliminada exitosamente",
        });
        loadCategorias(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar la categoría",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (categoria: CategoriaProducto) => {
    setSelectedCategoria(categoria);
    setIsDeleteModalOpen(true);
  };

  const handleEditCategoria = (categoria: CategoriaProducto) => {
    setSelectedCategoria(categoria);
    setIsEditModalOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset a la primera página al buscar
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Categorías de Producto</h1>
          <p className="text-muted-foreground">
            Administra las categorías de productos del sistema Miau Miau
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Package className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorías del Sistema</CardTitle>
          <CardDescription>
            Lista de categorías de productos registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categorías por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Categorías Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando categorías...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : categorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No se encontraron categorías
                    </TableCell>
                  </TableRow>
                ) : (
                  categorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{categoria.nombre}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {categoria.descripcion || "Sin descripción"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {categoria.createdAt ? new Date(categoria.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCategoria(categoria)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Categoría
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteClick(categoria)}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalCategorias)} de {totalCategorias} categorías
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
              <span>Total categorías: {totalCategorias}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateCategoriaProductoModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onCategoriaCreated={loadCategorias}
      />

      <EditCategoriaProductoModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        categoria={selectedCategoria}
        onCategoriaUpdated={loadCategorias}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteCategoria}
        itemName={selectedCategoria?.nombre}
        itemType="categoría de producto"
        title="Eliminar Categoría"
        description={`¿Estás seguro de que deseas eliminar la categoría "${selectedCategoria?.nombre}"? Esta acción no se puede deshacer y afectará todos los productos asociados.`}
      />
    </div>
  );
};

export default CategoriasProducto;
