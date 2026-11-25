import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { proveedoresService, Proveedor } from "@/services/proveedoresService";
import { CreateProveedorModal } from "@/components/modals/CreateProveedorModal";
import { EditProveedorModal } from "@/components/modals/EditProveedorModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, Store, UserCheck, UserX } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { TablePagination } from "@/components/TablePagination";
import { canCreate, canEdit, canDelete } from "@/utils/permissions";

const Proveedores = () => {
  const { toast } = useToast();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);

  // Estadísticas
  const [stats, setStats] = useState({
    totalProveedores: 0,
    proveedoresActivos: 0,
    proveedoresInactivos: 0,
  });

  // Cargar proveedores
  const loadProveedores = async () => {
    try {
      setLoading(true);
      const response = await proveedoresService.getAllProveedores({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        activos: 'true'
      });

      setProveedores(response.data.proveedores);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await proveedoresService.getProveedorStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  useEffect(() => {
    loadProveedores();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreateSuccess = () => {
    loadProveedores();
    loadStats();
    setIsCreateModalOpen(false);
  };

  const handleEditSuccess = () => {
    loadProveedores();
    loadStats();
    setIsEditModalOpen(false);
    setSelectedProveedor(null);
  };

  const handleDeleteSuccess = () => {
    loadProveedores();
    loadStats();
    setIsDeleteModalOpen(false);
    setSelectedProveedor(null);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsEditModalOpen(true);
  };

  const handleDelete = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">
            Gestiona los proveedores del sistema
          </p>
        </div>
        {canCreate('suppliers') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Proveedores" value={stats.totalProveedores} icon={Store} tone="primary" />
        <StatCard title="Proveedores Activos" value={stats.proveedoresActivos} icon={UserCheck} tone="success" />
        <StatCard title="Proveedores Inactivos" value={stats.proveedoresInactivos} icon={UserX} tone="destructive" />
      </div>

      {/* Lista de Proveedores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardDescription>
            Lista de todos los proveedores registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, correo o teléfono..."
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
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando proveedores...
                    </TableCell>
                  </TableRow>
                ) : proveedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron proveedores
                    </TableCell>
                  </TableRow>
                ) : (
                  proveedores.map((proveedor) => (
                    <TableRow key={proveedor.id}>
                      <TableCell className="font-medium">
                        {proveedor.nombre}
                      </TableCell>
                      <TableCell>
                        {proveedor.correo}
                      </TableCell>
                      <TableCell>
                        {proveedor.telefono}
                      </TableCell>
                      <TableCell>
                        {proveedor.descripcion || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {formatDate(proveedor.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit('suppliers') && (
                              <DropdownMenuItem
                                onClick={() => handleEdit(proveedor)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete('suppliers') && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(proveedor)}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            page={currentPage}
            pageSize={itemsPerPage}
            total={totalItems}
            label="proveedores"
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Modales */}
      <CreateProveedorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedProveedor && (
        <EditProveedorModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProveedor(null);
          }}
          onSuccess={handleEditSuccess}
          proveedor={selectedProveedor}
        />
      )}

      {selectedProveedor && (
        <ConfirmDeleteModal
          open={isDeleteModalOpen}
          onOpenChange={(open) => {
            setIsDeleteModalOpen(open);
            if (!open) {
              setSelectedProveedor(null);
            }
          }}
          onConfirm={async () => {
            if (selectedProveedor) {
              await proveedoresService.deleteProveedor(selectedProveedor.id);
              handleDeleteSuccess();
            }
          }}
          title="Eliminar Proveedor"
          description={`¿Estás seguro de que quieres eliminar el proveedor "${selectedProveedor.nombre}"? Esta acción no se puede deshacer.`}
        />
      )}
    </div>
  );
};

export default Proveedores;
