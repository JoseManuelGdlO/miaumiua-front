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
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: string;
  loading?: boolean;
}

const ConfirmDeleteModal = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  itemType = "elemento",
  loading = false
}: ConfirmDeleteModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al eliminar:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultTitle = title || `Eliminar ${itemType}`;
  const defaultDescription = description || 
    (itemName 
      ? `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`
      : `¿Estás seguro de que deseas eliminar este ${itemType}? Esta acción no se puede deshacer.`
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {defaultTitle}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <DialogDescription className="text-sm text-gray-600">
            {defaultDescription}
          </DialogDescription>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting || loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || loading}
            className="w-full sm:w-auto"
          >
            {(isDeleting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteModal;
