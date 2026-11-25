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
import { Search, Plus, MoreHorizontal, Edit, Trash2, UserPlus, Loader2, UserX, UserCheck } from "lucide-react";
import { canCreate, canEdit, canDelete } from "@/utils/permissions";
import { useToast } from "@/hooks/use-toast";
import { usersService, User } from "@/services/usersService";
import CreateUserModal from "@/components/modals/CreateUserModal";
import EditUserModal from "@/components/modals/EditUserModal";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

const Users = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 8;

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersService.getAllUsers({
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage
      });
      
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages);
        setTotalUsers(response.data.total);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800 border-green-200">Activo</Badge>
      : <Badge variant="destructive">Inactivo</Badge>;
  };

  const getRoleBadge = (roleName: string) => {
    const roleColors: Record<string, string> = {
      "admin": "bg-blue-100 text-blue-800 border-blue-200",
      "super_admin": "bg-purple-100 text-purple-800 border-purple-200",
      "supervisor_ventas": "bg-orange-100 text-orange-800 border-orange-200",
      "supervisor_tecnico": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "agente_chat": "bg-green-100 text-green-800 border-green-200",
      "inventario": "bg-gray-100 text-gray-800 border-gray-200",
      "marketing": "bg-pink-100 text-pink-800 border-pink-200"
    };
    
    return <Badge className={roleColors[roleName] || "bg-gray-100 text-gray-800 border-gray-200"}>{roleName}</Badge>;
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await usersService.deleteUser(selectedUser.id);
      if (response.success) {
        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado exitosamente",
        });
        loadUsers(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el usuario",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleChangePasswordClick = (user: User) => {
    setSelectedUser(user);
    setIsChangePasswordModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleToggleActive = async (user: User) => {
    try {
      const newStatus = !user.isActive;
      const response = await usersService.updateUser(user.id, { isActive: newStatus });
      
      if (response.success) {
        toast({
          title: newStatus ? "Usuario activado" : "Usuario desactivado",
          description: `El usuario "${user.nombre_completo}" ha sido ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
        });
        loadUsers(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cambiar el estado del usuario",
        variant: "destructive"
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset a la primera página al buscar
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema Miau Miau
          </p>
        </div>
        {canCreate('users') && (
          <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Lista de usuarios registrados con sus roles y estados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios por nombre, email, rol o ciudad..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando usuarios...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.nombre_completo.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{user.nombre_completo}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.correo_electronico}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.rol?.nombre || 'Sin rol')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.isActive)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.ciudad?.nombre || 'Sin ciudad'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'Nunca'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit('users') && (
                              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Usuario
                              </DropdownMenuItem>
                            )}
                            {canEdit('users') && (
                              <DropdownMenuItem onClick={() => handleChangePasswordClick(user)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Cambiar Contraseña
                              </DropdownMenuItem>
                            )}
                            {canEdit('users') && (
                              <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                {user.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Desactivar Usuario
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activar Usuario
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            {canDelete('users') && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteClick(user)}
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
            total={totalUsers}
            label="usuarios"
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <CreateUserModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onUserCreated={loadUsers}
      />

      <EditUserModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        user={selectedUser}
        onUserUpdated={loadUsers}
      />

      <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
        user={selectedUser}
        onPasswordChanged={loadUsers}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteUser}
        itemName={selectedUser?.nombre_completo}
        itemType="usuario"
        title="Eliminar Usuario"
        description={`¿Estás seguro de que deseas eliminar al usuario "${selectedUser?.nombre_completo}"? Esta acción no se puede deshacer y el usuario perderá acceso al sistema.`}
      />
    </div>
  );
};

export default Users;