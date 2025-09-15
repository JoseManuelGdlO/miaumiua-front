import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { pesosService, CreatePesoData } from "@/services/pesosService";
import { Loader2 } from "lucide-react";

interface CreatePesoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPesoCreated: () => void;
}

const CreatePesoModal = ({ 
  open, 
  onOpenChange, 
  onPesoCreated 
}: CreatePesoModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePesoData>({
    cantidad: 0,
    unidad_medida: "kg"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.cantidad || formData.cantidad <= 0) {
      toast({
        title: "Error de validación",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive"
      });
      return;
    }

    if (formData.cantidad < 0.01) {
      toast({
        title: "Error de validación",
        description: "La cantidad debe ser mayor a 0.01",
        variant: "destructive"
      });
      return;
    }

    if (!formData.unidad_medida) {
      toast({
        title: "Error de validación",
        description: "Debe seleccionar una unidad de medida",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await pesosService.createPeso(formData);
      
      if (response.success) {
        toast({
          title: "Peso creado",
          description: "El peso ha sido creado exitosamente",
        });
        
        // Limpiar el formulario
        setFormData({
          cantidad: 0,
          unidad_medida: "kg"
        });
        
        // Cerrar el modal
        onOpenChange(false);
        
        // Recargar la lista
        onPesoCreated();
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el peso",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al crear peso:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el peso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreatePesoData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Peso</DialogTitle>
          <DialogDescription>
            Crea un nuevo peso con su unidad de medida correspondiente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad *</Label>
            <Input
              id="cantidad"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.cantidad}
              onChange={(e) => handleInputChange("cantidad", parseFloat(e.target.value) || 0)}
              placeholder="Ej: 1.5, 2, 0.5"
              required
            />
            <p className="text-xs text-muted-foreground">
              Ingresa la cantidad numérica del peso
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
            <Select
              value={formData.unidad_medida}
              onValueChange={(value) => handleInputChange("unidad_medida", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una unidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                <SelectItem value="g">Gramos (g)</SelectItem>
                <SelectItem value="lb">Libras (lb)</SelectItem>
                <SelectItem value="oz">Onzas (oz)</SelectItem>
                <SelectItem value="ton">Toneladas (ton)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecciona la unidad de medida correspondiente
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
              Crear Peso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePesoModal;
