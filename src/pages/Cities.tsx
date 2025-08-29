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
import { Search, Plus, MoreHorizontal, Edit, Trash2, MapPin, Users, Package } from "lucide-react";
import CreateCityModal from "@/components/modals/CreateCityModal";

const Cities = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const itemsPerPage = 8;
  
  const cities = [
    {
      id: 1,
      name: "Ciudad de México",
      department: "CDMX",
      status: "Activa",
      deliveryZones: 16,
      activeCustomers: 2847,
      totalProducts: 12,
      monthlyOrders: 8456,
      avgDeliveryTime: "1-2 días",
      manager: "Ana García",
      phone: "+52 55 1234 5678",
      address: "Av. Polanco #100, Polanco"
    },
    {
      id: 2,
      name: "Guadalajara",
      department: "Jalisco", 
      status: "Activa",
      deliveryZones: 10,
      activeCustomers: 1892,
      totalProducts: 8,
      monthlyOrders: 4103,
      avgDeliveryTime: "1-2 días",
      manager: "Carlos Mendoza",
      phone: "+52 33 2345 6789",
      address: "Av. Providencia #1500, Providencia"
    },
    {
      id: 3,
      name: "Monterrey",
      department: "Nuevo León",
      status: "Activa",
      deliveryZones: 8,
      activeCustomers: 1454,
      totalProducts: 7,
      monthlyOrders: 3276,
      avgDeliveryTime: "1-3 días",
      manager: "Laura Rodríguez", 
      phone: "+52 81 3456 7890",
      address: "Av. Constitución #2000, San Pedro"
    },
    {
      id: 4,
      name: "Puebla",
      department: "Puebla",
      status: "Activa",
      deliveryZones: 6,
      activeCustomers: 832,
      totalProducts: 5,
      monthlyOrders: 1987,
      avgDeliveryTime: "2-4 días",
      manager: "Miguel Torres",
      phone: "+52 22 4567 8901",
      address: "Blvd. Atlixco #1200, Angelópolis"
    },
    {
      id: 5,
      name: "Tijuana",
      department: "Baja California",
      status: "Activa",
      deliveryZones: 5,
      activeCustomers: 698,
      totalProducts: 4,
      monthlyOrders: 1556,
      avgDeliveryTime: "2-3 días",
      manager: "Sofia Valencia",
      phone: "+52 66 5678 9012",
      address: "Zona Río, Paseo de los Héroes #1500"
    },
    {
      id: 6,
      name: "León",
      department: "Guanajuato",
      status: "Activa",
      deliveryZones: 4,
      activeCustomers: 567,
      totalProducts: 4,
      monthlyOrders: 1234,
      avgDeliveryTime: "2-3 días",
      manager: "Diego Morales",
      phone: "+52 47 6789 0123",
      address: "Blvd. López Mateos #2500, Del Valle"
    },
    {
      id: 7,
      name: "Mérida",
      department: "Yucatán",
      status: "Activa",
      deliveryZones: 3,
      activeCustomers: 434,
      totalProducts: 3,
      monthlyOrders: 867,
      avgDeliveryTime: "2-4 días",
      manager: "Camila Herrera",
      phone: "+52 99 7890 1234",
      address: "Paseo de Montejo #350, Centro"
    },
    {
      id: 8,
      name: "Zapopan",
      department: "Jalisco",
      status: "Pausada",
      deliveryZones: 2,
      activeCustomers: 256,
      totalProducts: 2,
      monthlyOrders: 498,
      avgDeliveryTime: "3-5 días",
      manager: "Roberto Jiménez",
      phone: "+52 33 8901 2345",
      address: "Av. Real del Country #1800, Real del Country"
    },
    {
      id: 9,
      name: "Toluca",
      department: "Estado de México",
      status: "En Evaluación",
      deliveryZones: 1,
      activeCustomers: 0,
      totalProducts: 0,
      monthlyOrders: 0,
      avgDeliveryTime: "N/A",
      manager: "Patricia Ruiz",
      phone: "+52 72 9012 3456",
      address: "Av. Independencia #300, Centro"
    },
    {
      id: 10,
      name: "Querétaro",
      department: "Querétaro",
      status: "Planificada",
      deliveryZones: 0,
      activeCustomers: 0,
      totalProducts: 0,
      monthlyOrders: 0,
      avgDeliveryTime: "N/A",
      manager: "Sin asignar",
      phone: "N/A",
      address: "Por definir"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "Activa": "bg-success text-success-foreground",
      "Pausada": "bg-warning text-warning-foreground",
      "En Evaluación": "bg-primary text-primary-foreground",
      "Planificada": "bg-secondary text-secondary-foreground",
      "Inactiva": "bg-destructive text-destructive-foreground"
    };
    return <Badge className={statusColors[status as keyof typeof statusColors]}>{status}</Badge>;
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCities = filteredCities.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ciudades por nombre, departamento o manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Cities Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cobertura</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCities.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {city.name}
                        </div>
                        <div className="text-sm text-muted-foreground">{city.department}</div>
                        <div className="text-xs text-muted-foreground">{city.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(city.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{city.deliveryZones} zonas</div>
                        <div className="text-sm text-muted-foreground">
                          {city.monthlyOrders} pedidos/mes
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{city.activeCustomers.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{city.totalProducts}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{city.manager}</div>
                        <div className="text-xs text-muted-foreground">{city.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{city.avgDeliveryTime}</div>
                        <div className="text-muted-foreground text-xs">promedio</div>
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
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Ciudad
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MapPin className="mr-2 h-4 w-4" />
                            Gestionar Zonas
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            Ver Clientes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Package className="mr-2 h-4 w-4" />
                            Ver Inventario
                          </DropdownMenuItem>
                          {city.status !== "Activa" && (
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
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
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredCities.length)} de {filteredCities.length} ciudades
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
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

      <CreateCityModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
};

export default Cities;