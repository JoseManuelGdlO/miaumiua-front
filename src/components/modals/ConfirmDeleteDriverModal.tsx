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
import { Loader2, AlertTriangle } from "lucide-react";
import { driversService } from "@/services/driversService";
import { useToast } from "@/hooks/use-toast";

interface ConfirmDeleteDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver: {
    id: number;
    nombre_completo: string;
    codigo_repartidor: string;
  } | null;
}

const ConfirmDeleteDriverModal = ({ isOpen, onClose, onSuccess, driver }: ConfirmDeleteDriverModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!driver) return;

    try {
      setLoading(true);
      const response = await driversService.deleteDriver(driver.id);
      
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Repartidor eliminado correctamente",
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el repartidor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al eliminar repartidor:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el repartidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!driver) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Eliminar Repartidor</span>
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar al repartidor{" "}
            <strong>{driver.nombre_completo}</strong> (Código: {driver.codigo_repartidor})?
            <br />
            <br />
            Esta acción no se puede deshacer. El repartidor será marcado como eliminado
            pero se mantendrá en el sistema para fines de auditoría.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar Repartidor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteDriverModal;
