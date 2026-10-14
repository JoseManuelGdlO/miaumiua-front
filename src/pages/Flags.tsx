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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablePagination } from "@/components/TablePagination";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { flagsService, Flag } from "@/services/flagsService";

const Flags = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFlags, setTotalFlags] = useState(0);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    nombre: "",
    color: "#3B82F6",
    descripcion: "",
    activo: true,
  });

  // Cargar flags al montar el componente
  useEffect(() => {
    loadFlags();
  }, [currentPage, searchTerm, statusFilter]);

  const loadFlags = async () => {
    try {
      setLoading(true);
      
      // Mapear el filtro de estado a los valores que espera el backend
      let activosParam: 'true' | 'false' | undefined = undefined;
      if (statusFilter === 'active') {
        activosParam = 'true';
      } else if (statusFilter === 'inactive') {
        activosParam = 'false';
      }
      
      const response = await flagsService.getFlags({
        activos: activosParam,
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage
      });
      
      if (response.success) {
        setFlags(response.data.flags);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalFlags(response.data.pagination?.total || 0);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los flags",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al cargar flags:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar los flags",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlag = async () => {
    if (!selectedFlag) return;
    
    try {
      const response = await flagsService.deleteFlag(selectedFlag.id);
      if (response.success) {
        toast({
          title: "Flag eliminado",
          description: "El flag ha sido eliminado exitosamente",
        });
        loadFlags();
      }
    } catch (error) {
      console.error('Error al eliminar flag:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el flag",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (flag: Flag) => {
    setSelectedFlag(flag);
    setIsDeleteModalOpen(true);
  };

  const handleEditFlag = (flag: Flag) => {
    setSelectedFlag(flag);
    setFormData({
      nombre: flag.nombre,
      color: flag.color,
      descripcion: flag.descripcion || "",
      activo: flag.activo,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateFlag = () => {
    setFormData({
      nombre: "",
      color: "#3B82F6",
      descripcion: "",
      activo: true,
    });
    setSelectedFlag(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveFlag = async () => {
    try {
      if (selectedFlag) {
        // Editar
        const response = await flagsService.updateFlag(selectedFlag.id, formData);
        if (response.success) {
          toast({
            title: "Flag actualizado",
            description: "El flag ha sido actualizado exitosamente",
          });
          setIsEditModalOpen(false);
          loadFlags();
        }
      } else {
        // Crear
        const response = await flagsService.createFlag(formData);
        if (response.success) {
          toast({
            title: "Flag creado",
            description: "El flag ha sido creado exitosamente",
          });
          setIsCreateModalOpen(false);
          loadFlags();
        }
      }
    } catch (error) {
      console.error('Error al guardar flag:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el flag",
        variant: "destructive"
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flags</h1>
          <p className="text-muted-foreground">
            Gestiona los flags personalizables para las conversaciones
          </p>
        </div>
        <Button onClick={handleCreateFlag}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Flag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flags</CardTitle>
          <CardDescription>
            Lista de flags para marcar conversaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar flags..."
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
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                      Cargando flags...
                    </TableCell>
                  </TableRow>
                ) : flags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No se encontraron flags
                    </TableCell>
                  </TableRow>
                ) : (
                  flags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell className="font-medium">{flag.nombre}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded-full border"
                            style={{ backgroundColor: flag.color }}
                          />
                          <span className="font-mono text-sm text-muted-foreground">
                            {flag.color}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {flag.descripcion || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={flag.activo ? "outline" : "secondary"}>
                          {flag.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditFlag(flag)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(flag)}
                              className="text-destructive"
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

          <TablePagination
            page={currentPage}
            pageSize={itemsPerPage}
            total={totalFlags}
            label="flags"
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={isCreateModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          setIsEditModalOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedFlag ? "Editar Flag" : "Crear Flag"}
            </DialogTitle>
            <DialogDescription>
              {selectedFlag
                ? "Modifica los detalles del flag"
                : "Crea un nuevo flag personalizable para las conversaciones"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej: Urgente, VIP, Seguimiento"
              />
            </div>
            <div>
              <Label htmlFor="color">Color *</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-16 h-10 rounded border"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="#3B82F6"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Descripción opcional del flag"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) =>
                  setFormData({ ...formData, activo: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="activo">Flag activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveFlag} disabled={!formData.nombre.trim()}>
              {selectedFlag ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el flag "{selectedFlag?.nombre}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleDeleteFlag();
                setIsDeleteModalOpen(false);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Flags;
