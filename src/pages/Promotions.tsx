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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Tag, Calendar } from "lucide-react";
import CreatePromotionModal from "@/components/modals/CreatePromotionModal";

const Promotions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const itemsPerPage = 8;
  
  const promotions = [
    {
      id: 1,
      name: "Descuento Bienvenida",
      code: "BIENVENIDO15",
      discount: "15%",
      type: "Porcentaje",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      used: 245,
      limit: 1000,
      status: "Activa",
      cities: ["Bogotá", "Medellín", "Cali"]
    },
    {
      id: 2,
      name: "Arena Premium 2x1",
      code: "PREMIUM2X1",
      discount: "50%",
      type: "Producto",
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      used: 89,
      limit: 500,
      status: "Activa",
      cities: ["Bogotá"]
    },
    {
      id: 3,
      name: "Envío Gratis +50k",
      code: "ENVIOGRATIS",
      discount: "$0",
      type: "Envío",
      startDate: "2024-01-10",
      endDate: "2024-03-10",
      used: 156,
      limit: null,
      status: "Activa",
      cities: ["Todas"]
    },
    {
      id: 4,
      name: "Black Friday Gatos",
      code: "BLACKFRIDAY30",
      discount: "30%",
      type: "Porcentaje",
      startDate: "2023-11-24",
      endDate: "2023-11-27",
      used: 892,
      limit: 1000,
      status: "Finalizada",
      cities: ["Todas"]
    },
    {
      id: 5,
      name: "Arena Antibacterial -20%",
      code: "ANTIBAC20",
      discount: "20%",
      type: "Categoría",
      startDate: "2024-01-05",
      endDate: "2024-02-28",
      used: 67,
      limit: 300,
      status: "Activa",
      cities: ["Medellín", "Cali", "Barranquilla"]
    },
    {
      id: 6,
      name: "Cliente Frecuente VIP",
      code: "VIP25",
      discount: "25%",
      type: "Cliente VIP",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      used: 34,
      limit: 100,
      status: "Activa",
      cities: ["Todas"]
    },
    {
      id: 7,
      name: "Compra Mínima 3 Bultos",
      code: "VOLUMEN15",
      discount: "15%",
      type: "Volumen",
      startDate: "2024-01-12",
      endDate: "2024-04-12",
      used: 23,
      limit: 200,
      status: "Activa",
      cities: ["Bogotá", "Medellín"]
    },
    {
      id: 8,
      name: "Arena Perfumada Descuento",
      code: "PERFUME10",
      discount: "10%",
      type: "Producto",
      startDate: "2024-01-08",
      endDate: "2024-01-31",
      used: 112,
      limit: 400,
      status: "Pausada",
      cities: ["Cali", "Cartagena"]
    },
    {
      id: 9,
      name: "Referido Amigo",
      code: "REFERIDO20",
      discount: "20%",
      type: "Referido",
      startDate: "2024-01-01",
      endDate: "2024-06-30",
      used: 78,
      limit: null,
      status: "Activa",
      cities: ["Todas"]
    },
    {
      id: 10,
      name: "San Valentín Gatos",
      code: "AMOR14",
      discount: "14%",
      type: "Especial",
      startDate: "2024-02-10",
      endDate: "2024-02-18",
      used: 0,
      limit: 150,
      status: "Programada",
      cities: ["Todas"]
    },
    // Agregar más datos para demostrar paginación
    ...Array.from({ length: 15 }, (_, i) => ({
      id: 11 + i,
      name: `Promoción ${11 + i}`,
      code: `PROMO${11 + i}`,
      discount: `${Math.floor(Math.random() * 30 + 5)}%`,
      type: ["Porcentaje", "Producto", "Envío"][Math.floor(Math.random() * 3)],
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      used: Math.floor(Math.random() * 100),
      limit: Math.floor(Math.random() * 500 + 100),
      status: ["Activa", "Pausada", "Finalizada"][Math.floor(Math.random() * 3)],
      cities: ["Bogotá", "Medellín"]
    }))
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "Activa": "bg-success text-success-foreground",
      "Pausada": "bg-warning text-warning-foreground",
      "Finalizada": "bg-secondary text-secondary-foreground",
      "Programada": "bg-primary text-primary-foreground"
    };
    return <Badge className={statusColors[status as keyof typeof statusColors] || "bg-secondary"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      "Porcentaje": "bg-primary/10 text-primary",
      "Producto": "bg-success/10 text-success",
      "Envío": "bg-warning/10 text-warning",
      "Categoría": "bg-accent/10 text-accent-foreground",
      "Cliente VIP": "bg-destructive/10 text-destructive",
      "Volumen": "bg-secondary text-secondary-foreground",
      "Referido": "bg-primary/20 text-primary",
      "Especial": "bg-primary text-primary-foreground"
    };
    return <Badge variant="outline" className={typeColors[type]}>{type}</Badge>;
  };

  const filteredPromotions = promotions.filter(promo =>
    promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPromotions = filteredPromotions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Promociones</h1>
          <p className="text-muted-foreground">
            Administra descuentos y ofertas especiales para productos Miau Miau
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Tag className="h-4 w-4" />
          Nueva Promoción
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promociones Activas</CardTitle>
          <CardDescription>
            Campañas promocionales configuradas para diferentes productos y ciudades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar promociones por nombre, código o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Promotions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promoción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPromotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{promo.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{promo.code}</div>
                        <div className="text-xs text-muted-foreground">
                          {promo.cities.length > 3 ? "Todas las ciudades" : promo.cities.join(", ")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(promo.type)}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {promo.discount}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {promo.startDate}
                        </div>
                        <div className="text-muted-foreground">
                          hasta {promo.endDate}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {promo.used} {promo.limit ? `/ ${promo.limit}` : ""}
                        </div>
                        {promo.limit && (
                          <div className="w-full bg-secondary rounded-full h-1">
                            <div 
                              className="bg-primary h-1 rounded-full" 
                              style={{ width: `${(promo.used / promo.limit) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(promo.status)}
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
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Tag className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
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
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredPromotions.length)} de {filteredPromotions.length} promociones
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

      <CreatePromotionModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
};

export default Promotions;