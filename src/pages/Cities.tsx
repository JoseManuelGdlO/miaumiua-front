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
import { Search, Plus, MoreHorizontal, Edit, Trash2, MapPin, Loader2, Phone, Mail, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { citiesService, City } from "@/services/citiesService";
import CreateCityModal from "@/components/modals/CreateCityModal";
import EditCityModal from "@/components/modals/EditCityModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

const Cities = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCities, setTotalCities] = useState(0);
  const itemsPerPage = 8;

  // Cargar ciudades al montar el componente
  useEffect(() => {
    loadCities();
  }, [currentPage, searchTerm, statusFilter]);

  const loadCities = async () => {
    try {
      setLoading(true);
      const response = await citiesService.getAllCities({
        activos: statusFilter === 'all' ? undefined : statusFilter as 'true' | 'false',
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage
      });
      
      if (response.success) {
        setCities(response.data.cities);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCities(response.data.pagination.total);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las ciudades",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al cargar ciudades:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar las ciudades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCity = async () => {
    if (!selectedCity) return;
    
    try {
      const response = await citiesService.deleteCity(selectedCity.id);
      if (response.success) {
        toast({
          title: "Ciudad eliminada",
          description: "La ciudad ha sido eliminada exitosamente",
        });
        loadCities(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al eliminar ciudad:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar la ciudad",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (city: City) => {
    setSelectedCity(city);
    setIsDeleteModalOpen(true);
  };

  const handleEditCity = (city: City) => {
    setSelectedCity(city);
    setIsEditModalOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset a la primera página al buscar
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset a la primera página al filtrar
  };

  const getStatusBadge = (city: City) => {
    if (city.baja_logica) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Inactiva</Badge>;
    }

    const statusColors: Record<string, string> = {
      "activa": "bg-green-100 text-green-800 border-green-200",
      "inactiva": "bg-gray-100 text-gray-800 border-gray-200",
      "en_construccion": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "mantenimiento": "bg-orange-100 text-orange-800 border-orange-200",
      "suspendida": "bg-red-100 text-red-800 border-red-200"
    };

    const statusLabels: Record<string, string> = {
      "activa": "Activa",
      "inactiva": "Inactiva",
      "en_construccion": "En Construcción",
      "mantenimiento": "Mantenimiento",
      "suspendida": "Suspendida"
    };

    return (
      <Badge className={statusColors[city.estado_inicial] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {statusLabels[city.estado_inicial] || city.estado_inicial}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Ciudades</h1>
          <p className="text-muted-foreground">
            Administra las ciudades donde opera Miau Miau y sus zonas de cobertura
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <MapPin className="h-4 w-4" />
          Nueva Ciudad
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ciudades de Operación</CardTitle>
          <CardDescription>
            Ubicaciones activas y en proceso de implementación para distribución de arena Miau Miau
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, departamento o manager..."
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
                <SelectItem value="true">Activas</SelectItem>
                <SelectItem value="false">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cities Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando ciudades...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : cities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron ciudades
                    </TableCell>
                  </TableRow>
                ) : (
                  cities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{city.nombre}</div>
                            <div className="text-sm text-muted-foreground">
                              {city.direccion_operaciones}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{city.departamento}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{city.manager}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{city.telefono}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{city.email_contacto}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(city)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(city.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCity(city)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Ciudad
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteClick(city)}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalCities)} de {totalCities} ciudades
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
              <span>Total ciudades: {totalCities}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateCityModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onCityCreated={loadCities}
      />

      <EditCityModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        city={selectedCity}
        onCityUpdated={loadCities}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteCity}
        itemName={selectedCity?.nombre}
        itemType="ciudad"
        title="Eliminar Ciudad"
        description={`¿Estás seguro de que deseas eliminar la ciudad "${selectedCity?.nombre}"? Esta acción no se puede deshacer y afectará todos los usuarios y pedidos asociados.`}
      />
    </div>
  );
};

export default Cities;