import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Tag } from "lucide-react";
import { flagsService, Flag } from "@/services/flagsService";
import { useToast } from "@/hooks/use-toast";

interface AssignFlagsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversacionId: number;
  onSuccess?: () => void;
}

const AssignFlagsModal = ({
  open,
  onOpenChange,
  conversacionId,
  onSuccess,
}: AssignFlagsModalProps) => {
  const { toast } = useToast();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [selectedFlagIds, setSelectedFlagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && conversacionId) {
      loadData();
    }
  }, [open, conversacionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar todos los flags activos
      const flagsResponse = await flagsService.getFlags({
        activos: 'true',
        limit: 100,
      });
      setFlags(flagsResponse.data.flags || []);

      // Cargar flags asignados a esta conversación
      const conversationFlagsResponse = await flagsService.getConversationFlags(conversacionId);
      const assignedFlagIds = (conversationFlagsResponse.data.flags || []).map((f) => f.id);
      setSelectedFlagIds(assignedFlagIds);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar flags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = (flagId: number) => {
    setSelectedFlagIds((prev) => {
      if (prev.includes(flagId)) {
        return prev.filter((id) => id !== flagId);
      } else {
        return [...prev, flagId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Obtener flags actualmente asignados
      const currentResponse = await flagsService.getConversationFlags(conversacionId);
      const currentFlagIds = (currentResponse.data.flags || []).map((f) => f.id);

      // Determinar qué flags agregar y cuáles remover
      const toAdd = selectedFlagIds.filter((id) => !currentFlagIds.includes(id));
      const toRemove = currentFlagIds.filter((id) => !selectedFlagIds.includes(id));

      // Agregar nuevos flags
      for (const flagId of toAdd) {
        await flagsService.assignFlag(flagId, conversacionId);
      }

      // Remover flags
      for (const flagId of toRemove) {
        await flagsService.removeFlag(flagId, conversacionId);
      }

      toast({
        title: "Éxito",
        description: "Flags actualizados correctamente",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar flags",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gestionar Flags de Conversación
          </DialogTitle>
          <DialogDescription>
            Selecciona los flags que deseas asignar a esta conversación
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {flags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay flags disponibles. Crea flags primero.
                </p>
              ) : (
                flags.map((flag) => {
                  const isSelected = selectedFlagIds.includes(flag.id);
                  return (
                    <div
                      key={flag.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleFlag(flag.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleFlag(flag.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: flag.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <Label className="cursor-pointer font-medium">
                          {flag.nombre}
                        </Label>
                        {flag.descripcion && (
                          <p className="text-sm text-muted-foreground truncate">
                            {flag.descripcion}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${flag.color}20`,
                            borderColor: flag.color,
                            color: flag.color,
                          }}
                        >
                          Seleccionado
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignFlagsModal;
