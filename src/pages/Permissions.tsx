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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Key, Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { permissionsService, Permission } from "@/services/permissionsService";
import CreatePermissionModal from "@/components/modals/CreatePermissionModal";
import EditPermissionModal from "@/components/modals/EditPermissionModal";

const Permissions = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  // Cargar permisos al montar el componente
  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionsService.getAllPermissions({ activos: 'true' });
      
      if (response.success) {
        setPermissions(response.data.permissions);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los permisos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar los permisos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermission = async (permission: Permission) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el permiso "${permission.nombre}"?`)) {
      return;
    }

    try {
      const response = await permissionsService.deletePermission(permission.id);
      
      if (response.success) {
        toast({
          title: "Permiso eliminado",
          description: `Permiso "${permission.nombre}" eliminado exitosamente`,
        });
        loadPermissions(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al eliminar permiso:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el permiso",
        variant: "destructive"
      });
    }
  };

  const handleEditPermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsEditModalOpen(true);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      "lectura": "👁️",
      "escritura": "✏️",
      "eliminacion": "🗑️",
      "administracion": "⚙️",
      "especial": "🔐"
    };
    return icons[type] || "📋";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "lectura": "bg-blue-100 text-blue-800",
      "escritura": "bg-green-100 text-green-800",
      "eliminacion": "bg-red-100 text-red-800",
      "administracion": "bg-purple-100 text-purple-800",
      "especial": "bg-orange-100 text-orange-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const filteredPermissions = permissions.filter(permission =>
    permission.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando permisos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Permisos</h1>
          <p className="text-muted-foreground">
            Administra los permisos del sistema Miau Miau
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Key className="h-4 w-4" />
          Nuevo Permiso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permisos del Sistema</CardTitle>
          <CardDescription>
            Permisos disponibles organizados por categoría y tipo de acceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar permisos por nombre, descripción o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Permissions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permiso</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getTypeIcon(permission.tipo)}</span>
                        <div>
                          <div className="font-medium text-foreground">{permission.nombre}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{permission.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(permission.tipo)}>
                        {permission.tipo.charAt(0).toUpperCase() + permission.tipo.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {permission.descripcion || "Sin descripción"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {permission.created_at ? new Date(permission.created_at).toLocaleDateString('es-ES') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPermission(permission)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Permiso
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeletePermission(permission)}
                          >
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

          {/* Stats */}
          <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
            <div>
              Mostrando {filteredPermissions.length} de {permissions.length} permisos
            </div>
            <div className="flex items-center space-x-4">
              <span>Total permisos: {permissions.length}</span>
              <span>Permisos activos: {permissions.filter(p => !p.baja_logica).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreatePermissionModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onPermissionCreated={loadPermissions}
      />

      <EditPermissionModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        permission={selectedPermission}
        onPermissionUpdated={loadPermissions}
      />
    </div>
  );
};

export default Permissions;