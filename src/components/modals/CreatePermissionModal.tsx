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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { permissionsService, CreatePermissionData, PERMISSION_CATEGORIES } from "@/services/permissionsService";

interface CreatePermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionCreated?: () => void;
}

const CreatePermissionModal = ({ 
  open, 
  onOpenChange, 
  onPermissionCreated 
}: CreatePermissionModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [formData, setFormData] = useState<CreatePermissionData>({
    nombre: "",
    categoria: "",
    descripcion: "",
    tipo: "lectura"
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        nombre: "",
        categoria: "",
        descripcion: "",
        tipo: "lectura"
      });
      setSelectedCategory("");
      setSelectedAction("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        toast({
          title: "Error",
          description: "El nombre del permiso es requerido",
          variant: "destructive"
        });
        return;
      }

      if (!formData.categoria) {
        toast({
          title: "Error",
          description: "La categoría es requerida",
          variant: "destructive"
        });
        return;
      }

      if (!formData.tipo) {
        toast({
          title: "Error",
          description: "El tipo es requerido",
          variant: "destructive"
        });
        return;
      }

      const response = await permissionsService.createPermission(formData);

      if (response.success) {
        toast({
          title: "Permiso creado",
          description: `Permiso "${formData.nombre}" creado exitosamente`,
        });

        // Reset form
        setFormData({
          nombre: "",
          categoria: "",
          descripcion: "",
          tipo: "lectura"
        });

        onOpenChange(false);
        onPermissionCreated?.();
      }
    } catch (error) {
      console.error('Error al crear permiso:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el permiso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreatePermissionData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedAction("");
    setFormData(prev => ({
      ...prev,
      categoria: category
    }));
  };

  const handleActionChange = (action: string) => {
    setSelectedAction(action);
    const permissionName = `${selectedCategory}.${action}`;
    setFormData(prev => ({
      ...prev,
      nombre: permissionName
    }));
  };

  const getAvailableActions = () => {
    if (!selectedCategory) return [];
    return PERMISSION_CATEGORIES[selectedCategory as keyof typeof PERMISSION_CATEGORIES]?.actions || [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Permiso</DialogTitle>
          <DialogDescription>
            Define un nuevo permiso para el sistema. Los permisos controlan el acceso a diferentes funcionalidades.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría *</Label>
            <Select 
              value={selectedCategory} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <div className="space-y-2">
              <Label htmlFor="action">Acción *</Label>
              <Select 
                value={selectedAction} 
                onValueChange={handleActionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una acción" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableActions().map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Permiso *</Label>
            <Input
              id="nombre"
              placeholder="Se genera automáticamente"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              required
              readOnly={selectedCategory && selectedAction}
            />
            <p className="text-xs text-muted-foreground">
              Se genera automáticamente como: categoría.acción
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Permiso *</Label>
            <Select 
              value={formData.tipo} 
              onValueChange={(value) => handleInputChange('tipo', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lectura">Lectura</SelectItem>
                <SelectItem value="escritura">Escritura</SelectItem>
                <SelectItem value="eliminacion">Eliminación</SelectItem>
                <SelectItem value="administracion">Administración</SelectItem>
                <SelectItem value="especial">Especial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe qué permite hacer este permiso..."
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Permiso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePermissionModal;
