import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateRoleModal = ({ open, onOpenChange }: CreateRoleModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedPermissions: [] as string[]
  });

  const permissionCategories = [
    {
      name: "Dashboard",
      permissions: [
        { id: "dashboard.view", name: "Ver Dashboard", critical: false }
      ]
    },
    {
      name: "Usuarios", 
      permissions: [
        { id: "users.view", name: "Ver Usuarios", critical: false },
        { id: "users.manage", name: "Gestionar Usuarios", critical: true }
      ]
    },
    {
      name: "Seguridad",
      permissions: [
        { id: "roles.view", name: "Ver Roles", critical: false },
        { id: "roles.manage", name: "Gestionar Roles", critical: true },
        { id: "permissions.manage", name: "Gestionar Permisos", critical: true }
      ]
    },
    {
      name: "Agentes IA",
      permissions: [
        { id: "agents.view", name: "Ver Agentes", critical: false },
        { id: "agents.configure", name: "Configurar Agentes", critical: false }
      ]
    },
    {
      name: "Inventario",
      permissions: [
        { id: "inventory.view", name: "Ver Inventario", critical: false },
        { id: "inventory.manage", name: "Gestionar Inventario", critical: false },
        { id: "products.manage", name: "Gestionar Productos", critical: false }
      ]
    },
    {
      name: "Clientes",
      permissions: [
        { id: "customers.view", name: "Ver Clientes", critical: false },
        { id: "customers.edit", name: "Editar Clientes", critical: false }
      ]
    },
    {
      name: "Marketing", 
      permissions: [
        { id: "promotions.view", name: "Ver Promociones", critical: false },
        { id: "promotions.manage", name: "Gestionar Promociones", critical: false },
        { id: "campaigns.manage", name: "Gestionar Campañas", critical: false }
      ]
    },
    {
      name: "Reportes",
      permissions: [
        { id: "reports.view", name: "Ver Reportes", critical: false },
        { id: "reports.generate", name: "Generar Reportes", critical: false }
      ]
    },
    {
      name: "Sistema",
      permissions: [
        { id: "cities.manage", name: "Gestionar Ciudades", critical: false },
        { id: "system.configure", name: "Configurar Sistema", critical: true }
      ]
    }
  ];

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter(id => id !== permissionId)
        : [...prev.selectedPermissions, permissionId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      toast({
        title: "Error",
        description: "Por favor completa el nombre y descripción del rol",
        variant: "destructive"
      });
      return;
    }

    if (formData.selectedPermissions.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un permiso para el rol",
        variant: "destructive" 
      });
      return;
    }

    // Simular creación de rol
    console.log("Creando rol:", formData);

    toast({
      title: "Rol creado",
      description: `Rol "${formData.name}" creado con ${formData.selectedPermissions.length} permisos`,
    });

    // Reset form y cerrar modal
    setFormData({
      name: "",
      description: "", 
      selectedPermissions: []
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Rol</DialogTitle>
          <DialogDescription>
            Define un nuevo rol con sus permisos específicos para el sistema Miau Miau
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Nombre del Rol *</Label>
              <Input
                id="roleName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Supervisor Regional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleDescription">Descripción *</Label>
              <Textarea
                id="roleDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe las responsabilidades y alcance de este rol..."
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Permisos del Rol</Label>
              <Badge variant="secondary">
                {formData.selectedPermissions.length} permisos seleccionados
              </Badge>
            </div>

            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {permissionCategories.map((category) => (
                <Card key={category.name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={formData.selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                          <Label 
                            htmlFor={permission.id} 
                            className={`text-sm ${permission.critical ? 'text-destructive font-medium' : ''} cursor-pointer flex-1`}
                          >
                            {permission.name}
                            {permission.critical && (
                              <Badge variant="outline" className="ml-2 text-xs text-destructive border-destructive">
                                Crítico
                              </Badge>
                            )}
                          </Label>
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
            <Button type="submit">
              Crear Rol
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoleModal;