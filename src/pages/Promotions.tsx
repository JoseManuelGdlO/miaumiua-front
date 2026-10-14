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
import { TablePagination } from "@/components/TablePagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Tag, Calendar, Loader2, Clock, XCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { canCreate, canEdit, canDelete } from "@/utils/permissions";
import CreatePromotionModal from "@/components/modals/CreatePromotionModal";
import EditPromotionModal from "@/components/modals/EditPromotionModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { promotionsService, Promotion } from "@/services/promotionsService";
import { useToast } from "@/hooks/use-toast";

const Promotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const itemsPerPage = 8;
  const { toast } = useToast();

  // Cargar promociones
  const loadPromotions = async () => {
    try {
      setLoading(true);
      const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        // activos: 'true', // Temporarily commented to see all promotions
        include_cities: 'true' as 'true' | 'false'
      };
      
      console.log('Fetching promotions with params:', queryParams);
      const response = await promotionsService.getAllPromotions(queryParams);
      console.log('Promotions response:', response);

      setPromotions(response.data.promotions);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      console.error('Error al cargar promociones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las promociones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, [currentPage, searchTerm]);

  // Manejar búsqueda
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Manejar eliminación
  const handleDelete = async () => {
    if (!selectedPromotion) return;

    try {
      await promotionsService.deletePromotion(selectedPromotion.id);
      toast({
        title: "Éxito",
        description: "Promoción eliminada correctamente",
      });
      loadPromotions();
    } catch (error) {
      console.error('Error al eliminar promoción:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la promoción",
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedPromotion(null);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Obtener estado de la promoción
  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.fecha_inicio);
    const endDate = new Date(promotion.fecha_fin);

    if (promotion.baja_logica) {
      return { status: "Eliminada", variant: "secondary" as const };
    }

    if (now < startDate) {
      return { status: "Pendiente", variant: "outline" as const };
    } else if (now > endDate) {
      return { status: "Expirada", variant: "destructive" as const };
    } else {
      return { status: "Activa", variant: "default" as const };
    }
  };

  // Formatear descuento
  const formatDiscount = (promotion: Promotion) => {
    switch (promotion.tipo_promocion) {
      case 'porcentaje':
        return `${promotion.valor_descuento}%`;
      case 'monto_fijo':
        return `$${promotion.valor_descuento.toLocaleString()}`;
      case 'envio_gratis':
        return 'Envío Gratis';
      case 'descuento_especial':
        return `${promotion.valor_descuento}%`;
      default:
        return promotion.valor_descuento.toString();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promociones</h1>
          <p className="text-muted-foreground">
            Gestiona las promociones y descuentos disponibles
          </p>
        </div>
        {canCreate('promotions') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Promoción
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Promociones" value={totalItems} icon={Tag} tone="primary" />
        <StatCard
          title="Promociones Activas"
          value={promotions.filter(p => getPromotionStatus(p).status === 'Activa').length}
          icon={Calendar}
          tone="success"
        />
        <StatCard
          title="Pendientes"
          value={promotions.filter(p => getPromotionStatus(p).status === 'Pendiente').length}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          title="Expiradas"
          value={promotions.filter(p => getPromotionStatus(p).status === 'Expirada').length}
          icon={XCircle}
          tone="destructive"
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Promociones</CardTitle>
          <CardDescription>
            Lista de todas las promociones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead>Límite</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ciudades</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando promociones...
                    </TableCell>
                  </TableRow>
                ) : promotions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron promociones
                    </TableCell>
                  </TableRow>
                ) : (
                  promotions.map((promotion) => {
                    const status = getPromotionStatus(promotion);
                    return (
                      <TableRow key={promotion.id}>
                        <TableCell className="font-medium">
                          {promotion.nombre}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{promotion.codigo}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDiscount(promotion)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {promotion.tipo_promocion.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Inicio: {formatDate(promotion.fecha_inicio)}</div>
                            <div>Fin: {formatDate(promotion.fecha_fin)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {promotion.limite_uso === 0 ? 'Ilimitado' : promotion.limite_uso}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {promotion.ciudades && promotion.ciudades.length > 0
                              ? `${promotion.ciudades.length} ciudad${promotion.ciudades.length > 1 ? 'es' : ''}`
                              : 'Todas'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEdit('promotions') && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPromotion(promotion);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canDelete('promotions') && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPromotion(promotion);
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

          <TablePagination
            page={currentPage}
            pageSize={itemsPerPage}
            total={totalItems}
            label="promociones"
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <CreatePromotionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadPromotions}
      />

      {selectedPromotion && (
        <EditPromotionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPromotion(null);
          }}
          onSuccess={loadPromotions}
          promotion={selectedPromotion}
        />
      )}

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) {
            setSelectedPromotion(null);
          }
        }}
        onConfirm={handleDelete}
        title="Eliminar Promoción"
        description={`¿Estás seguro de que quieres eliminar la promoción "${selectedPromotion?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default Promotions;