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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Shield, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { rolesService, Role } from "@/services/rolesService";
import CreateRoleModal from "@/components/modals/CreateRoleModal";
import ManageRolePermissionsModal from "@/components/modals/ManageRolePermissionsModal";

const Roles = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ id: string; name: string } | null>(null);

  // Cargar roles al montar el componente
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesService.getAllRoles({ 
        activos: 'true',
        include_permissions: 'true'
      });
      
      if (response.success) {
        setRoles(response.data.roles);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los roles",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar los roles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, string> = {
      "Administrador": "🔐",
      "Supervisor Ventas": "📈",
      "Supervisor Técnico": "⚙️", 
      "Agente Chat": "💬",
      "Inventario": "📦",
      "Marketing": "🎯"
    };
    return icons[roleName] || "👤";
  };

  const filteredRoles = roles.filter(role =>
    role.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.descripcion && role.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (role.permissions && role.permissions.some(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Roles</h1>
          <p className="text-muted-foreground">
            Define y administra los roles de usuario en el sistema Miau Miau
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Shield className="h-4 w-4" />
          Nuevo Rol
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles del Sistema</CardTitle>
          <CardDescription>
            Roles configurados con sus respectivos permisos y usuarios asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar roles por nombre, descripción o permisos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Roles Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando roles...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron roles
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role: Role & { users_count?: number }) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getRoleIcon(role.nombre)}</span>
                          <div>
                            <div className="font-medium text-foreground">{role.nombre}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {role.descripcion || "Sin descripción"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {role.permissions && role.permissions.slice(0, 3).map((permission, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {permission.nombre}
                            </Badge>
                          ))}
                          {role.permissions && role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} más
                            </Badge>
                          )}
                          {!role.permissions && (
                            <Badge variant="outline" className="text-xs">
                              Sin permisos
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{role.users_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {role.created_at ? new Date(role.created_at).toLocaleDateString('es-ES') : 'N/A'}
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
                              Editar Rol
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedRole({ id: role.id.toString(), name: role.nombre });
                              setPermissionsModalOpen(true);
                            }}>
                              <Shield className="mr-2 h-4 w-4" />
                              Gestionar Permisos
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              Ver Usuarios
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
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

          {/* Stats */}
          <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
            <div>
              Mostrando {filteredRoles.length} de {roles.length} roles
            </div>
            <div className="flex items-center space-x-4">
              <span>Roles activos: {roles.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateRoleModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onRoleCreated={loadRoles}
      />

      <ManageRolePermissionsModal
        open={permissionsModalOpen}
        onOpenChange={setPermissionsModalOpen}
        roleId={selectedRole?.id}
        roleName={selectedRole?.name}
        onPermissionsUpdated={loadRoles}
      />
    </div>
  );
};

export default Roles;