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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { rolesService, CreateRoleData, Permission } from "@/services/rolesService";
import { permissionsService } from "@/services/permissionsService";

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleCreated?: () => void;
}

const CreateRoleModal = ({ open, onOpenChange, onRoleCreated }: CreateRoleModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedPermissions: [] as number[]
  });

  // Cargar permisos al abrir el modal
  useEffect(() => {
    if (open) {
      loadPermissions();
    }
  }, [open]);

  const loadPermissions = async () => {
    try {
      const response = await permissionsService.getAllPermissions({ activos: 'true' });
      if (response.success) {
        setPermissions(response.data.permissions);
      }
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos",
        variant: "destructive"
      });
    }
  };

  // Agrupar permisos por categoría
  const permissionCategories = permissions.reduce((acc, permission) => {
    const category = permission.categoria;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handlePermissionToggle = (permissionId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter(id => id !== permissionId)
        : [...prev.selectedPermissions, permissionId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "El nombre del rol es requerido",
          variant: "destructive"
        });
        return;
      }

      if (!formData.description.trim()) {
        toast({
          title: "Error",
          description: "La descripción del rol es requerida",
          variant: "destructive"
        });
        return;
      }

      const roleData: CreateRoleData = {
        nombre: formData.name,
        descripcion: formData.description,
        permissions: formData.selectedPermissions
      };

      const response = await rolesService.createRole(roleData);

      if (response.success) {
        toast({
          title: "Rol creado",
          description: `Rol "${formData.name}" creado exitosamente`,
        });

        // Reset form
        setFormData({
          name: "",
          description: "",
          selectedPermissions: []
        });

        onOpenChange(false);
        onRoleCreated?.();
      }
    } catch (error) {
      console.error('Error al crear rol:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el rol",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
              {Object.entries(permissionCategories).map(([categoryName, categoryPermissions]) => (
                <Card key={categoryName}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{categoryName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id.toString()}
                            checked={formData.selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                          <Label 
                            htmlFor={permission.id.toString()} 
                            className={`text-sm ${permission.tipo === 'administracion' ? 'text-destructive font-medium' : ''} cursor-pointer flex-1`}
                          >
                            {permission.nombre}
                            {permission.tipo === 'administracion' && (
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Rol"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoleModal;