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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { clientesService, Cliente } from "@/services/clientesService";
import { Loader2 } from "lucide-react";

interface ChangeClientePortalPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
  onPasswordChanged?: () => void;
}

const ChangeClientePortalPasswordModal = ({
  open,
  onOpenChange,
  cliente,
  onPasswordChanged,
}: ChangeClientePortalPasswordModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [forcePasswordChange, setForcePasswordChange] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    setLoading(true);

    try {
      if (!formData.newPassword.trim()) {
        toast({
          title: "Error",
          description: "La nueva contraseña es requerida",
          variant: "destructive",
        });
        return;
      }

      if (formData.newPassword.length < 6) {
        toast({
          title: "Error",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive",
        });
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
          variant: "destructive",
        });
        return;
      }

      const response = await clientesService.resetPortalPassword(cliente.id, {
        newPassword: formData.newPassword,
        forcePasswordChange,
      });

      if (response.success) {
        toast({
          title: "Contraseña del portal actualizada",
          description: `El cliente "${cliente.nombre_completo}" podrá iniciar sesión en la tienda con la nueva contraseña.`,
        });

        setFormData({ newPassword: "", confirmPassword: "" });
        setForcePasswordChange(true);
        onOpenChange(false);
        onPasswordChanged?.();
      }
    } catch (error) {
      console.error("Error al restablecer contraseña del portal:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contraseña portal (tienda web)</DialogTitle>
          <DialogDescription>
            Establece una contraseña para que el cliente acceda a su cuenta en el sitio público. Si marca “Forzar cambio”,
            deberá elegir una nueva contraseña en el primer acceso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="portalNewPassword">Nueva contraseña *</Label>
            <Input
              id="portalNewPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portalConfirmPassword">Confirmar contraseña *</Label>
            <Input
              id="portalConfirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Repite la nueva contraseña"
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="forceChange"
              checked={forcePasswordChange}
              onCheckedChange={(v) => setForcePasswordChange(v === true)}
            />
            <Label htmlFor="forceChange" className="text-sm font-normal cursor-pointer">
              Forzar cambio de contraseña en el próximo inicio de sesión
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeClientePortalPasswordModal;
