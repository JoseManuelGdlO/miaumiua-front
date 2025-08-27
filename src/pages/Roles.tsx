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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Shield, Users } from "lucide-react";

const Roles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const roles = [
    {
      id: 1,
      name: "Administrador",
      description: "Acceso completo al sistema, gestión de usuarios y configuraciones",
      permissions: ["Gestión completa", "Usuarios", "Roles", "Inventario", "Reportes", "Configuración"],
      users: 2,
      createdAt: "2024-01-10"
    },
    {
      id: 2,
      name: "Supervisor Ventas",
      description: "Supervisión de equipos de venta y acceso a métricas comerciales",
      permissions: ["Ver Dashboard", "Gestión Clientes", "Reportes Ventas", "Promociones"],
      users: 3,
      createdAt: "2024-01-10"
    },
    {
      id: 3,
      name: "Supervisor Técnico",
      description: "Gestión técnica de agentes IA y configuraciones de chatbots",
      permissions: ["Contexto Agentes", "Configuración Bots", "Reportes Técnicos", "Inventario"],
      users: 1,
      createdAt: "2024-01-10"
    },
    {
      id: 4,
      name: "Agente Chat",
      description: "Operación básica de chatbots y atención al cliente",
      permissions: ["Ver Dashboard", "Gestión Clientes", "Chat Management"],
      users: 8,
      createdAt: "2024-01-10"
    },
    {
      id: 5,
      name: "Inventario",
      description: "Gestión de stock y productos por ciudad",
      permissions: ["Gestión Inventario", "Productos", "Reportes Stock", "Ciudades"],
      users: 2,
      createdAt: "2024-01-10"
    },
    {
      id: 6,
      name: "Marketing",
      description: "Creación y gestión de campañas promocionales",
      permissions: ["Promociones", "Campañas", "Reportes Marketing", "Clientes"],
      users: 1,
      createdAt: "2024-01-12"
    }
  ];

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
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.permissions.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
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
        <Button className="gap-2">
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
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getRoleIcon(role.name)}</span>
                        <div>
                          <div className="font-medium text-foreground">{role.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {role.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {role.permissions.slice(0, 3).map((permission, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{role.users}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {role.createdAt}
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
                          <DropdownMenuItem>
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
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
            <div>
              Mostrando {filteredRoles.length} de {roles.length} roles
            </div>
            <div className="flex items-center space-x-4">
              <span>Total usuarios: {roles.reduce((acc, role) => acc + role.users, 0)}</span>
              <span>Roles activos: {roles.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Roles;