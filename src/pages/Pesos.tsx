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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Weight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pesosService, Peso } from "@/services/pesosService";
import CreatePesoModal from "@/components/modals/CreatePesoModal";
import EditPesoModal from "@/components/modals/EditPesoModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

const Pesos = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [unidadFilter, setUnidadFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPeso, setSelectedPeso] = useState<Peso | null>(null);
  const [pesos, setPesos] = useState<Peso[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPesos, setTotalPesos] = useState(0);
  const itemsPerPage = 8;

  // Cargar pesos al montar el componente
  useEffect(() => {
    loadPesos();
  }, [currentPage, searchTerm, unidadFilter]);

  const loadPesos = async () => {
    try {
      setLoading(true);
      const response = await pesosService.getAllPesos({
        activos: 'true',
        search: searchTerm || undefined,
        unidad_medida: unidadFilter && unidadFilter !== 'all' ? unidadFilter as any : undefined,
        page: currentPage,
        limit: itemsPerPage
      });
      
      if (response.success) {
        setPesos(response.data.pesos);
        setTotalPages(response.data.pagination.totalPages);
        setTotalPesos(response.data.pagination.total);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los pesos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al cargar pesos:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar los pesos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeso = async () => {
    if (!selectedPeso) return;
    
    try {
      const response = await pesosService.deletePeso(selectedPeso.id);
      if (response.success) {
        toast({
          title: "Peso eliminado",
          description: "El peso ha sido eliminado exitosamente",
        });
        loadPesos(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al eliminar peso:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el peso",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (peso: Peso) => {
    setSelectedPeso(peso);
    setIsDeleteModalOpen(true);
  };

  const handleEditPeso = (peso: Peso) => {
    setSelectedPeso(peso);
    setIsEditModalOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset a la primera página al buscar
  };

  const handleUnidadFilter = (value: string) => {
    setUnidadFilter(value);
    setCurrentPage(1); // Reset a la primera página al filtrar
  };

  const getUnidadBadge = (unidad: string) => {
    const unidadColors: Record<string, string> = {
      "kg": "bg-blue-100 text-blue-800 border-blue-200",
      "g": "bg-green-100 text-green-800 border-green-200",
      "lb": "bg-orange-100 text-orange-800 border-orange-200",
      "oz": "bg-purple-100 text-purple-800 border-purple-200",
      "ton": "bg-red-100 text-red-800 border-red-200"
    };
    
    return <Badge className={unidadColors[unidad] || "bg-gray-100 text-gray-800 border-gray-200"}>{unidad}</Badge>;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Pesos</h1>
          <p className="text-muted-foreground">
            Administra los pesos y unidades de medida del sistema Miau Miau
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Weight className="h-4 w-4" />
          Nuevo Peso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pesos del Sistema</CardTitle>
          <CardDescription>
            Lista de pesos registrados con sus unidades de medida
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cantidad..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
                type="number"
                step="0.01"
              />
            </div>
            <Select value={unidadFilter} onValueChange={handleUnidadFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por unidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las unidades</SelectItem>
                <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                <SelectItem value="g">Gramos (g)</SelectItem>
                <SelectItem value="lb">Libras (lb)</SelectItem>
                <SelectItem value="oz">Onzas (oz)</SelectItem>
                <SelectItem value="ton">Toneladas (ton)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pesos Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
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
                        <span>Cargando pesos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pesos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No se encontraron pesos
                    </TableCell>
                  </TableRow>
                ) : (
                  pesos.map((peso) => (
                    <TableRow key={peso.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Weight className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{peso.cantidad}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getUnidadBadge(peso.unidad_medida)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {peso.createdAt ? new Date(peso.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPeso(peso)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Peso
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteClick(peso)}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalPesos)} de {totalPesos} pesos
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
              <span>Total pesos: {totalPesos}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreatePesoModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onPesoCreated={loadPesos}
      />

      <EditPesoModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        peso={selectedPeso}
        onPesoUpdated={loadPesos}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeletePeso}
        itemName={`${selectedPeso?.cantidad} ${selectedPeso?.unidad_medida}`}
        itemType="peso"
        title="Eliminar Peso"
        description={`¿Estás seguro de que deseas eliminar el peso de ${selectedPeso?.cantidad} ${selectedPeso?.unidad_medida}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default Pesos;
