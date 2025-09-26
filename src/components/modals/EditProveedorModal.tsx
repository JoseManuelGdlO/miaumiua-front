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
import { useToast } from "@/hooks/use-toast";
import { proveedoresService, Proveedor } from "@/services/proveedoresService";
import { Loader2 } from "lucide-react";

interface EditProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proveedor: Proveedor;
}

const EditProveedorModal = ({ isOpen, onClose, onSuccess, proveedor }: EditProveedorModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    descripcion: "",
  });

  // Inicializar formulario con datos del proveedor
  useEffect(() => {
    if (proveedor && isOpen) {
      setFormData({
        nombre: proveedor.nombre,
        correo: proveedor.correo,
        telefono: proveedor.telefono,
        descripcion: proveedor.descripcion || "",
      });
    }
  }, [proveedor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const updateData = {
        nombre: formData.nombre,
        correo: formData.correo,
        telefono: formData.telefono,
        descripcion: formData.descripcion || undefined,
      };

      await proveedoresService.updateProveedor(proveedor.id, updateData);
      
      toast({
        title: "Éxito",
        description: "Proveedor actualizado correctamente",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al actualizar proveedor:', error);
      const errorMessage = error?.response?.data?.error || error?.message || "No se pudo actualizar el proveedor";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proveedor</DialogTitle>
          <DialogDescription>
            Modifica los datos del proveedor seleccionado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre del proveedor"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico *</Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input
              id="telefono"
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              placeholder="+57-1-234-5678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción del proveedor"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar Proveedor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { EditProveedorModal };
