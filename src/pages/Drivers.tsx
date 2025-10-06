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
import { Search, Plus, MoreHorizontal, Edit, Trash2, User, Phone, MapPin, Calendar, Truck, Loader2, Star, Activity } from "lucide-react";
import { canCreate, canEdit, canDelete, canActivateDriver, canViewDriverStats } from "@/utils/permissions";
import { driversService, Driver } from "@/services/driversService";
import { useToast } from "@/hooks/use-toast";
import CreateDriverModal from "@/components/modals/CreateDriverModal";
import EditDriverModal from "@/components/modals/EditDriverModal";
import ConfirmDeleteDriverModal from "@/components/modals/ConfirmDeleteDriverModal";

// Usar la interfaz Driver del servicio

const Drivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const itemsPerPage = 8;
  const { toast } = useToast();

  // Cargar repartidores
  const loadDrivers = async () => {
    try {
      setLoading(true);
      const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
      };
      
      const response = await driversService.getAllDrivers(queryParams);
      
      if (response.success) {
        setDrivers(response.data.repartidores);
        setTotalItems(response.data.total);
        setTotalPages(response.data.totalPages);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los repartidores",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error al cargar repartidores:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los repartidores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [currentPage, searchTerm]);

  // Manejar búsqueda
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Los datos ya vienen paginados del backend
  const paginatedDrivers = drivers;

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Obtener estado del repartidor
  const getDriverStatus = (driver: Driver) => {
    switch (driver.estado) {
      case 'activo':
        return { status: "Activo", variant: "default" as const };
      case 'inactivo':
        return { status: "Inactivo", variant: "secondary" as const };
      case 'ocupado':
        return { status: "Ocupado", variant: "destructive" as const };
      case 'disponible':
        return { status: "Disponible", variant: "default" as const };
      case 'en_ruta':
        return { status: "En Ruta", variant: "outline" as const };
      default:
        return { status: "Desconocido", variant: "secondary" as const };
    }
  };

  // Obtener icono del tipo de vehículo
  const getVehicleIcon = (tipo: string) => {
    switch (tipo) {
      case 'moto':
        return '🏍️';
      case 'bicicleta':
        return '🚲';
      case 'auto':
        return '🚗';
      case 'camioneta':
        return '🚐';
      case 'caminando':
        return '🚶';
      default:
        return '🚚';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repartidores</h1>
          <p className="text-muted-foreground">
            Gestiona todos los repartidores del sistema
          </p>
        </div>
        {canCreate('drivers') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Repartidor
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repartidores</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.filter(d => d.estado === 'disponible').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Ruta</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.filter(d => d.estado === 'en_ruta').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejor Calificados</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.filter(d => 
                d.calificacion_promedio && 
                typeof d.calificacion_promedio === 'number' && 
                d.calificacion_promedio >= 4.5
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Repartidores</CardTitle>
          <CardDescription>
            Lista de todos los repartidores del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código, teléfono o email..."
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
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Calificación</TableHead>
                  <TableHead>Entregas</TableHead>
                  <TableHead>Última Entrega</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando repartidores...
                    </TableCell>
                  </TableRow>
                ) : paginatedDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No se encontraron repartidores" : "No hay repartidores registrados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDrivers.map((driver) => {
                    const status = getDriverStatus(driver);
                    return (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <Badge variant="outline">{driver.codigo_repartidor}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {driver.nombre_completo}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{getVehicleIcon(driver.tipo_vehiculo)}</span>
                            <span className="capitalize">{driver.tipo_vehiculo}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {driver.ciudad ? (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{driver.ciudad.nombre}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin asignar</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="font-medium">
                              {driver.calificacion_promedio && typeof driver.calificacion_promedio === 'number' 
                                ? driver.calificacion_promedio.toFixed(1) 
                                : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <span className="font-medium">{driver.total_entregas || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {driver.fecha_ultima_entrega ? (
                            <div className="text-sm">
                              {formatDate(driver.fecha_ultima_entrega)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEdit('drivers') && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDriver(driver);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canActivateDriver() && (
                                <DropdownMenuItem>
                                  <Activity className="mr-2 h-4 w-4" />
                                  Cambiar Estado
                                </DropdownMenuItem>
                              )}
                              {canDelete('drivers') && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDriver(driver);
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} repartidores
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
      <CreateDriverModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadDrivers}
      />

      {selectedDriver && (
        <EditDriverModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDriver(null);
          }}
          onSuccess={loadDrivers}
          driver={selectedDriver}
        />
      )}

      {selectedDriver && (
        <ConfirmDeleteDriverModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedDriver(null);
          }}
          onSuccess={loadDrivers}
          driver={selectedDriver}
        />
      )}
    </div>
  );
};

export default Drivers;
