import { useState, useEffect } from "react";
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
import { categoriasProductoService, UpdateCategoriaProductoData, CategoriaProducto } from "@/services/categoriasProductoService";
import { Loader2 } from "lucide-react";

interface EditCategoriaProductoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: CategoriaProducto | null;
  onCategoriaUpdated: () => void;
}

const EditCategoriaProductoModal = ({ 
  open, 
  onOpenChange, 
  categoria,
  onCategoriaUpdated 
}: EditCategoriaProductoModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateCategoriaProductoData>({
    nombre: "",
    descripcion: ""
  });

  // Actualizar el formulario cuando cambie la categoría
  useEffect(() => {
    if (categoria) {
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || ""
      });
    }
  }, [categoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoria) return;

    // Validaciones básicas
    if (!formData.nombre?.trim()) {
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
      const response = await categoriasProductoService.updateCategoria(categoria.id, formData);
      
      if (response.success) {
        toast({
          title: "Categoría actualizada",
          description: "La categoría de producto ha sido actualizada exitosamente",
        });
        
        // Cerrar el modal
        onOpenChange(false);
        
        // Recargar la lista
        onCategoriaUpdated();
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar la categoría",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar la categoría",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateCategoriaProductoData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Categoría de Producto</DialogTitle>
          <DialogDescription>
            Modifica la información de la categoría de producto.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Categoría *</Label>
            <Input
              id="nombre"
              value={formData.nombre || ""}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              placeholder="Ej: Alimentos, Juguetes, Accesorios"
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              {(formData.nombre || "").length}/100 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion || ""}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Descripción opcional de la categoría..."
              maxLength={1000}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {(formData.descripcion || "").length}/1000 caracteres
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
              Actualizar Categoría
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoriaProductoModal;
