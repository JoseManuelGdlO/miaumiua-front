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
import { useToast } from "@/hooks/use-toast";
import { usersService, User } from "@/services/usersService";
import { Loader2 } from "lucide-react";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onPasswordChanged?: () => void;
}

const ChangePasswordModal = ({ open, onOpenChange, user, onPasswordChanged }: ChangePasswordModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Validaciones
      if (!formData.newPassword.trim()) {
        toast({
          title: "Error",
          description: "La nueva contraseña es requerida",
          variant: "destructive"
        });
        return;
      }

      if (formData.newPassword.length < 6) {
        toast({
          title: "Error",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive"
        });
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
          variant: "destructive"
        });
        return;
      }

      const response = await usersService.changeUserPassword(user.id, {
        newPassword: formData.newPassword
      });

      if (response.success) {
        toast({
          title: "Contraseña actualizada",
          description: `La contraseña del usuario "${user.nombre_completo}" ha sido actualizada exitosamente`,
        });

        // Reset form
        setFormData({
          newPassword: "",
          confirmPassword: ""
        });

        onOpenChange(false);
        onPasswordChanged?.();
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cambiar la contraseña",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Establece una nueva contraseña para el usuario {user.nombre_completo}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña *</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Repite la nueva contraseña"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Cambiar Contraseña"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;

