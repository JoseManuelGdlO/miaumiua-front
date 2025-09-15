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
import { permissionsService, CreatePermissionData } from "@/services/permissionsService";

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
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreatePermissionData>({
    nombre: "",
    categoria: "",
    descripcion: "",
    tipo: "lectura"
  });

  // Cargar categorías y tipos al abrir el modal
  useEffect(() => {
    if (open) {
      loadCategoriesAndTypes();
    }
  }, [open]);

  const loadCategoriesAndTypes = async () => {
    try {
      const [categoriesRes, typesRes] = await Promise.all([
        permissionsService.getCategories(),
        permissionsService.getTypes()
      ]);

      if (categoriesRes.success) {
        setCategories(categoriesRes.data.categories);
      }
      if (typesRes.success) {
        setTypes(typesRes.data.types);
      }
    } catch (error) {
      console.error('Error al cargar categorías y tipos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías y tipos",
        variant: "destructive"
      });
    }
  };

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
            <Label htmlFor="nombre">Nombre del Permiso *</Label>
            <Input
              id="nombre"
              placeholder="ej: users.manage"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Solo letras minúsculas y guiones bajos (ej: users.manage, inventory.view)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría *</Label>
            <Select 
              value={formData.categoria} 
              onValueChange={(value) => handleInputChange('categoria', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
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
