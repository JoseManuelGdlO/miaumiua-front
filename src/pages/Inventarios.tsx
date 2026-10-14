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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Package, Package2, Loader2, AlertTriangle, RotateCcw, DollarSign } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { canCreate, canEdit, canDelete } from "@/utils/permissions";
import CreateInventarioModal from "@/components/modals/CreateInventarioModal";
import EditInventarioModal from "@/components/modals/EditInventarioModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { inventariosService, Inventario } from "@/services/inventariosService";
import { useToast } from "@/hooks/use-toast";
import { formatCount, formatMoney } from "@/utils/format";

const CATEGORY_CHIP_COLORS = [
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-orange-100 text-orange-800 border-orange-200",
];

function categoryChipClass(name: string) {
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return CATEGORY_CHIP_COLORS[index % CATEGORY_CHIP_COLORS.length];
}

const Inventarios = () => {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
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
        activos: showArchived ? "false" : "true",
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
  }, [currentPage, searchTerm, showArchived]);

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

  // Manejar restauración
  const handleRestore = async (inventarioId: number) => {
    try {
      await inventariosService.restoreInventario(inventarioId);
      toast({
        title: "Éxito",
        description: "Inventario restaurado correctamente",
      });
      loadInventarios();
    } catch (error) {
      console.error('Error al restaurar inventario:', error);
      toast({
        title: "Error",
        description: "No se pudo restaurar el inventario",
        variant: "destructive",
      });
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
    // Si tiene baja lógica, mostrar "producto archivado"
    if (inventario.baja_logica) {
      return { status: "Producto archivado", variant: "outline" as const };
    }
    
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
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
        <StatCard title="Total Productos" value={totalItems} icon={Package} tone="primary" />
        <StatCard title="Productos Activos" value={inventarios.length} icon={Package2} tone="success" />
        <StatCard title="Stock Bajo" value={lowStockCount} icon={AlertTriangle} tone="destructive" />
        <StatCard
          title="Valor Total"
          value={formatPrice(inventarios.reduce((sum, inv) => sum + (inv.precio_venta * inv.stock_inicial), 0))}
          icon={DollarSign}
          tone="primary"
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
          <div>
            <CardTitle>Inventarios</CardTitle>
            <CardDescription>
              Lista de todos los productos en inventario
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Switch
              id="ver-archivados"
              checked={showArchived}
              onCheckedChange={(checked) => {
                setShowArchived(checked);
                setCurrentPage(1);
              }}
            />
            <Label htmlFor="ver-archivados" className="text-sm font-medium cursor-pointer whitespace-nowrap">
              Ver archivados
            </Label>
          </div>
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
                  <TableHead className="min-w-[16rem]">Producto</TableHead>
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
                        <TableCell className="whitespace-nowrap font-mono text-sm">
                          {inventario.sku}
                        </TableCell>
                        <TableCell className="min-w-[16rem] max-w-[28rem] whitespace-normal align-middle">
                          <div className="space-y-1 text-left">
                            <div className="font-medium break-words">{inventario.nombre}</div>
                            {inventario.descripcion && (
                              <div className="break-words text-sm text-muted-foreground">
                                {inventario.descripcion}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {inventario.categoria?.nombre ? (
                            <Badge variant="outline" className={`whitespace-nowrap ${categoryChipClass(inventario.categoria.nombre)}`}>
                              {inventario.categoria.nombre}
                            </Badge>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="mx-auto inline-block whitespace-nowrap text-left text-sm leading-5">
                            <div>
                              <span className="text-muted-foreground">Total: </span>
                              <span className="font-bold text-foreground">{formatCount(inventario.stock_inicial)}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Mín: {formatCount(inventario.stock_minimo)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="mx-auto inline-block whitespace-nowrap text-left text-sm leading-5">
                            <div>
                              <span className="text-muted-foreground">Venta: </span>
                              <span className="font-bold text-foreground">{formatMoney(inventario.precio_venta)}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Costo: {formatMoney(inventario.costo_unitario)}
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
                              {canEdit('inventory') && !inventario.baja_logica && (
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
                              {inventario.baja_logica ? (
                                canDelete('inventory') && (
                                  <DropdownMenuItem
                                    onClick={() => handleRestore(inventario.id)}
                                    className="text-green-600"
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restaurar
                                  </DropdownMenuItem>
                                )
                              ) : (
                                canDelete('inventory') && (
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
                                )
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
            label="inventarios"
            onPageChange={setCurrentPage}
          />
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
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) {
            setSelectedInventario(null);
          }
        }}
        onConfirm={handleDelete}
        title="Eliminar Inventario"
        description={`¿Estás seguro de que quieres eliminar el inventario "${selectedInventario?.nombre}"?.`}
      />
    </div>
  );
};

export default Inventarios;
