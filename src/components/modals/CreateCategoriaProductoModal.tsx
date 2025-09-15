import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { categoriasProductoService, CreateCategoriaProductoData } from "@/services/categoriasProductoService";
import { Loader2 } from "lucide-react";

interface CreateCategoriaProductoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoriaCreated: () => void;
}

const CreateCategoriaProductoModal = ({ 
  open, 
  onOpenChange, 
  onCategoriaCreated 
}: CreateCategoriaProductoModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCategoriaProductoData>({
    nombre: "",
    descripcion: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre de la categoría es obligatorio",
        variant: "destructive"
      });
      return;
    }

    if (formData.nombre.length < 2) {
      toast({
        title: "Error de validación",
        description: "El nombre debe tener al menos 2 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (formData.nombre.length > 100) {
      toast({
        title: "Error de validación",
        description: "El nombre no puede exceder 100 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (formData.descripcion && formData.descripcion.length > 1000) {
      toast({
        title: "Error de validación",
        description: "La descripción no puede exceder 1000 caracteres",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await categoriasProductoService.createCategoria(formData);
      
      if (response.success) {
        toast({
          title: "Categoría creada",
          description: "La categoría de producto ha sido creada exitosamente",
        });
        
        // Limpiar el formulario
        setFormData({
          nombre: "",
          descripcion: ""
        });
        
        // Cerrar el modal
        onOpenChange(false);
        
        // Recargar la lista
        onCategoriaCreated();
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear la categoría",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al crear categoría:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la categoría",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateCategoriaProductoData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Categoría de Producto</DialogTitle>
          <DialogDescription>
            Crea una nueva categoría para organizar los productos del sistema.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Categoría *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              placeholder="Ej: Alimentos, Juguetes, Accesorios"
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.nombre.length}/100 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Descripción opcional de la categoría..."
              maxLength={1000}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {formData.descripcion.length}/1000 caracteres
            </p>
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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Categoría
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoriaProductoModal;
