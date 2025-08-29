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
import { Search, Plus, MoreHorizontal, Edit, Trash2, UserPlus } from "lucide-react";
import CreateUserModal from "@/components/modals/CreateUserModal";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const itemsPerPage = 8;
  
  const users = [
    {
      id: 1,
      name: "Ana García",
      email: "ana.garcia@miaumiau.com",
      role: "Administrador",
      status: "Activo",
      lastLogin: "2024-01-15 10:30",
      city: "Ciudad de México"
    },
    {
      id: 2,
      name: "Carlos Mendoza",
      email: "carlos.mendoza@miaumiau.com",
      role: "Supervisor Ventas",
      status: "Activo",
      lastLogin: "2024-01-15 08:45",
      city: "Guadalajara"
    },
    {
      id: 3,
      name: "Laura Rodríguez",
      email: "laura.rodriguez@miaumiau.com",
      role: "Agente Chat",
      status: "Activo",
      lastLogin: "2024-01-15 09:15",
      city: "Monterrey"
    },
    {
      id: 4,
      name: "Miguel Torres",
      email: "miguel.torres@miaumiau.com",
      role: "Inventario",
      status: "Inactivo",
      lastLogin: "2024-01-12 16:20",
      city: "Puebla"
    },
    {
      id: 5,
      name: "Sofia Valencia",
      email: "sofia.valencia@miaumiau.com",
      role: "Agente Chat",
      status: "Activo",
      lastLogin: "2024-01-15 07:30",
      city: "Tijuana"
    },
    {
      id: 6,
      name: "Diego Morales",
      email: "diego.morales@miaumiau.com",
      role: "Supervisor Técnico",
      status: "Activo",
      lastLogin: "2024-01-14 22:15",
      city: "Ciudad de México"
    },
    // Agregar más usuarios para paginación
    ...Array.from({ length: 15 }, (_, i) => ({
      id: 7 + i,
      name: `Usuario ${7 + i}`,
      email: `usuario${7 + i}@miaumiau.com`,
      role: ["Agente Chat", "Inventario", "Supervisor Ventas"][Math.floor(Math.random() * 3)],
      status: Math.random() > 0.2 ? "Activo" : "Inactivo",
      lastLogin: "2024-01-15 09:00",
      city: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla"][Math.floor(Math.random() * 4)]
    }))
  ];

  const getStatusBadge = (status: string) => {
    return status === "Activo" 
      ? <Badge className="bg-success text-success-foreground">Activo</Badge>
      : <Badge variant="destructive">Inactivo</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      "Administrador": "bg-primary text-primary-foreground",
      "Supervisor Ventas": "bg-warning text-warning-foreground",
      "Supervisor Técnico": "bg-warning text-warning-foreground",
      "Agente Chat": "bg-accent text-accent-foreground",
      "Inventario": "bg-secondary text-secondary-foreground"
    };
    
    return <Badge className={roleColors[role] || "bg-secondary text-secondary-foreground"}>{role}</Badge>;
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema de chatbots Miau Miau
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Usuarios registrados en el sistema con sus roles y permisos
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  <TableHead>Rol</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell className="font-medium">{user.city}</TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin}
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
                            <UserPlus className="mr-2 h-4 w-4" />
                            Cambiar Rol
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

          {/* Stats and Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Activos: {users.filter(u => u.status === "Activo").length}</span>
              <span>Inactivos: {users.filter(u => u.status === "Inactivo").length}</span>
            </div>
          </div>

          {/* Pagination */}
          <Pagination className="mt-4">
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
        </CardContent>
      </Card>

      <CreateUserModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
};

export default Users;