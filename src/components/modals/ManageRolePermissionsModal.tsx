import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle } from "lucide-react";

interface ManageRolePermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId?: string;
  roleName?: string;
}

const ManageRolePermissionsModal = ({ 
  open, 
  onOpenChange, 
  roleId, 
  roleName 
}: ManageRolePermissionsModalProps) => {
  const { toast } = useToast();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const permissionCategories = [
    {
      name: "Dashboard & Navegación",
      icon: "📊",
      permissions: [
        { id: "dashboard.view", name: "Ver Dashboard Principal", description: "Acceso al panel principal del sistema", critical: false, currentlyHas: true },
        { id: "navigation.access", name: "Navegación Completa", description: "Acceso a todas las secciones del menú", critical: false, currentlyHas: false }
      ]
    },
    {
      name: "Gestión de Usuarios",
      icon: "👥", 
      permissions: [
        { id: "users.view", name: "Ver Lista de Usuarios", description: "Visualizar información de usuarios del sistema", critical: false, currentlyHas: true },
        { id: "users.create", name: "Crear Usuarios", description: "Agregar nuevos usuarios al sistema", critical: true, currentlyHas: false },
        { id: "users.edit", name: "Editar Usuarios", description: "Modificar información de usuarios existentes", critical: true, currentlyHas: false },
        { id: "users.delete", name: "Eliminar Usuarios", description: "Eliminar usuarios del sistema", critical: true, currentlyHas: false }
      ]
    },
    {
      name: "Roles y Seguridad",
      icon: "🔐",
      permissions: [
        { id: "roles.view", name: "Ver Roles", description: "Visualizar roles del sistema", critical: false, currentlyHas: false },
        { id: "roles.create", name: "Crear Roles", description: "Crear nuevos roles en el sistema", critical: true, currentlyHas: false },
        { id: "roles.edit", name: "Editar Roles", description: "Modificar roles existentes", critical: true, currentlyHas: false },
        { id: "permissions.manage", name: "Gestionar Permisos", description: "Asignar y revocar permisos", critical: true, currentlyHas: false }
      ]
    },
    {
      name: "Agentes de IA",
      icon: "🤖",
      permissions: [
        { id: "agents.view", name: "Ver Configuración de Agentes", description: "Acceder a la configuración de chatbots", critical: false, currentlyHas: true },
        { id: "agents.edit", name: "Editar Contexto de Agentes", description: "Modificar prompts y contexto de agentes IA", critical: false, currentlyHas: false },
        { id: "agents.deploy", name: "Implementar Cambios", description: "Aplicar cambios en agentes activos", critical: true, currentlyHas: false }
      ]
    },
    {
      name: "Inventario y Productos",
      icon: "📦",
      permissions: [
        { id: "inventory.view", name: "Ver Inventario", description: "Acceso a información de stock y productos", critical: false, currentlyHas: false },
        { id: "inventory.edit", name: "Editar Inventario", description: "Modificar cantidades y productos", critical: false, currentlyHas: false },
        { id: "products.manage", name: "Gestionar Productos", description: "Crear, editar y eliminar productos", critical: false, currentlyHas: false }
      ]
    },
    {
      name: "Clientes y Ventas",
      icon: "🛒",
      permissions: [
        { id: "customers.view", name: "Ver Clientes", description: "Acceder a base de datos de clientes", critical: false, currentlyHas: true },
        { id: "customers.edit", name: "Editar Clientes", description: "Modificar información de clientes", critical: false, currentlyHas: false },
        { id: "orders.view", name: "Ver Pedidos", description: "Acceso a historial de pedidos", critical: false, currentlyHas: false },
        { id: "orders.manage", name: "Gestionar Pedidos", description: "Crear y modificar pedidos", critical: false, currentlyHas: false }
      ]
    },
    {
      name: "Rutas y Logística",
      icon: "🚛",
      permissions: [
        { id: "routes.view", name: "Ver Rutas", description: "Visualizar planificación de rutas", critical: false, currentlyHas: false },
        { id: "routes.plan", name: "Planificar Rutas", description: "Crear y optimizar rutas de entrega", critical: false, currentlyHas: false },
        { id: "routes.assign", name: "Asignar Repartidores", description: "Asignar conductores a rutas", critical: false, currentlyHas: false }
      ]
    },
    {
      name: "Promociones y Marketing", 
      icon: "🎯",
      permissions: [
        { id: "promotions.view", name: "Ver Promociones", description: "Acceder a campañas promocionales", critical: false, currentlyHas: false },
        { id: "promotions.create", name: "Crear Promociones", description: "Diseñar nuevas campañas", critical: false, currentlyHas: false },
        { id: "promotions.edit", name: "Editar Promociones", description: "Modificar campañas existentes", critical: false, currentlyHas: false }
      ]
    },
    {
      name: "Reportes y Analytics",
      icon: "📈",
      permissions: [
        { id: "reports.view", name: "Ver Reportes", description: "Acceder a reportes del sistema", critical: false, currentlyHas: false },
        { id: "reports.generate", name: "Generar Reportes", description: "Crear reportes personalizados", critical: false, currentlyHas: false },
        { id: "analytics.access", name: "Acceder a Analytics", description: "Visualizar métricas avanzadas", critical: false, currentlyHas: false }
      ]
    },
    {
      name: "Configuración del Sistema",
      icon: "⚙️",
      permissions: [
        { id: "cities.manage", name: "Gestionar Ciudades", description: "Administrar ciudades disponibles", critical: false, currentlyHas: false },
        { id: "system.configure", name: "Configurar Sistema", description: "Modificar configuraciones generales", critical: true, currentlyHas: false },
        { id: "system.backup", name: "Gestionar Respaldos", description: "Crear y restaurar respaldos", critical: true, currentlyHas: false }
      ]
    }
  ];

  // Simular carga de permisos actuales del rol
  useEffect(() => {
    if (open && roleId) {
      const currentPermissions = permissionCategories
        .flatMap(cat => cat.permissions)
        .filter(perm => perm.currentlyHas)
        .map(perm => perm.id);
      setSelectedPermissions(currentPermissions);
    }
  }, [open, roleId]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = () => {
    console.log("Guardando permisos para rol:", roleId, selectedPermissions);
    
    toast({
      title: "Permisos actualizados",
      description: `Se han actualizado ${selectedPermissions.length} permisos para el rol "${roleName}"`,
    });
    
    onOpenChange(false);
  };

  const criticalPermissionsCount = selectedPermissions.filter(id => {
    const permission = permissionCategories
      .flatMap(cat => cat.permissions)
      .find(perm => perm.id === id);
    return permission?.critical;
  }).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestionar Permisos - {roleName}
          </DialogTitle>
          <DialogDescription>
            Configura los permisos específicos que tendrán los usuarios asignados a este rol
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen de permisos */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="gap-1">
                    {selectedPermissions.length} permisos seleccionados
                  </Badge>
                  {criticalPermissionsCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {criticalPermissionsCount} críticos
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Categorías de permisos */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {permissionCategories.map((category) => (
              <Card key={category.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.permissions.map((permission) => (
                      <div key={permission.id} className="space-y-2">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={permission.id} 
                              className={`text-sm font-medium cursor-pointer block ${
                                permission.critical ? 'text-destructive' : ''
                              }`}
                            >
                              {permission.name}
                              {permission.critical && (
                                <Badge variant="outline" className="ml-2 text-xs text-destructive border-destructive">
                                  Crítico
                                </Badge>
                              )}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageRolePermissionsModal;