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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Key, Lock } from "lucide-react";

const Permissions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const permissions = [
    {
      id: 1,
      name: "dashboard.view",
      displayName: "Ver Dashboard",
      description: "Permite acceder y visualizar el panel principal del sistema",
      category: "Dashboard",
      type: "read",
      roles: ["Administrador", "Supervisor Ventas", "Agente Chat"],
      critical: false
    },
    {
      id: 2,
      name: "users.manage",
      displayName: "Gestionar Usuarios", 
      description: "Crear, editar y eliminar usuarios del sistema",
      category: "Usuarios",
      type: "write",
      roles: ["Administrador"],
      critical: true
    },
    {
      id: 3,
      name: "roles.manage",
      displayName: "Gestionar Roles",
      description: "Crear, modificar y asignar roles a usuarios",
      category: "Seguridad",
      type: "write", 
      roles: ["Administrador"],
      critical: true
    },
    {
      id: 4,
      name: "agents.configure",
      displayName: "Configurar Agentes IA",
      description: "Modificar contexto y configuración de agentes de chatbot",
      category: "Agentes",
      type: "write",
      roles: ["Administrador", "Supervisor Técnico"],
      critical: false
    },
    {
      id: 5,
      name: "inventory.manage",
      displayName: "Gestionar Inventario",
      description: "Agregar, modificar y eliminar productos del inventario",
      category: "Inventario",
      type: "write",
      roles: ["Administrador", "Inventario", "Supervisor Técnico"],
      critical: false
    },
    {
      id: 6,
      name: "customers.view",
      displayName: "Ver Clientes",
      description: "Acceder a la base de datos de clientes y su información",
      category: "Clientes",
      type: "read",
      roles: ["Administrador", "Supervisor Ventas", "Agente Chat", "Marketing"],
      critical: false
    },
    {
      id: 7,
      name: "customers.edit",
      displayName: "Editar Clientes",
      description: "Modificar información y datos de clientes existentes",
      category: "Clientes", 
      type: "write",
      roles: ["Administrador", "Supervisor Ventas"],
      critical: false
    },
    {
      id: 8,
      name: "promotions.manage",
      displayName: "Gestionar Promociones",
      description: "Crear, editar y eliminar campañas promocionales",
      category: "Marketing",
      type: "write",
      roles: ["Administrador", "Supervisor Ventas", "Marketing"],
      critical: false
    },
    {
      id: 9,
      name: "cities.manage", 
      displayName: "Gestionar Ciudades",
      description: "Agregar y configurar ciudades disponibles para venta",
      category: "Configuración",
      type: "write",
      roles: ["Administrador"],
      critical: false
    },
    {
      id: 10,
      name: "reports.access",
      displayName: "Acceder Reportes",
      description: "Generar y visualizar reportes del sistema",
      category: "Reportes",
      type: "read", 
      roles: ["Administrador", "Supervisor Ventas", "Supervisor Técnico"],
      critical: false
    },
    {
      id: 11,
      name: "system.configure",
      displayName: "Configurar Sistema",
      description: "Modificar configuraciones generales del sistema",
      category: "Sistema",
      type: "write",
      roles: ["Administrador"],
      critical: true
    },
    {
      id: 12,
      name: "chat.manage",
      displayName: "Gestionar Chats",
      description: "Supervisar y gestionar conversaciones de chatbots",
      category: "Chatbots",
      type: "write",
      roles: ["Administrador", "Supervisor Ventas", "Agente Chat"],
      critical: false
    }
  ];

  const getTypeIcon = (type: string) => {
    return type === "read" ? "👁️" : "✏️";
  };

  const getTypeBadge = (type: string) => {
    return type === "read" 
      ? <Badge variant="secondary">Lectura</Badge>
      : <Badge className="bg-warning text-warning-foreground">Escritura</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      "Dashboard": "bg-primary/10 text-primary",
      "Usuarios": "bg-warning/10 text-warning",
      "Seguridad": "bg-destructive/10 text-destructive",
      "Agentes": "bg-success/10 text-success", 
      "Inventario": "bg-accent/10 text-accent-foreground",
      "Clientes": "bg-secondary text-secondary-foreground",
      "Marketing": "bg-primary/20 text-primary",
      "Configuración": "bg-muted text-muted-foreground",
      "Reportes": "bg-success/20 text-success",
      "Sistema": "bg-destructive/20 text-destructive",
      "Chatbots": "bg-primary/15 text-primary"
    };
    
    return (
      <Badge variant="outline" className={categoryColors[category] || "bg-secondary text-secondary-foreground"}>
        {category}
      </Badge>
    );
  };

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Permisos</h1>
          <p className="text-muted-foreground">
            Define y controla los permisos específicos del sistema Miau Miau
          </p>
        </div>
        <Button className="gap-2">
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
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Roles Asignados</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                  <TableRow key={permission.id} className={permission.critical ? "bg-destructive/5" : ""}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getTypeIcon(permission.type)}</span>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {permission.displayName}
                            {permission.critical && <Lock className="h-3 w-3 text-destructive" />}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {permission.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {permission.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(permission.category)}
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(permission.type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {permission.roles.slice(0, 2).map((role, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                        {permission.roles.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{permission.roles.length - 2} más
                          </Badge>
                        )}
                      </div>
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
                            Editar Permiso
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="mr-2 h-4 w-4" />
                            Asignar a Roles
                          </DropdownMenuItem>
                          {!permission.critical && (
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
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
              <span>Lectura: {permissions.filter(p => p.type === "read").length}</span>
              <span>Escritura: {permissions.filter(p => p.type === "write").length}</span>
              <span>Críticos: {permissions.filter(p => p.critical).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Permissions;