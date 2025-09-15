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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usersService, CreateUserData, Role } from "@/services/usersService";
import { rolesService } from "@/services/rolesService";

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: () => void;
}

const CreateUserModal = ({ open, onOpenChange, onUserCreated }: CreateUserModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo_electronico: "",
    contrasena: "",
    confirmPassword: "",
    rol_id: "",
    ciudad_id: ""
  });

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      // Cargar roles
      const rolesResponse = await rolesService.getAllRoles({ activos: 'true' });
      if (rolesResponse.success) {
        setRoles(rolesResponse.data.roles);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (!formData.nombre_completo.trim()) {
        toast({
          title: "Error",
          description: "El nombre completo es requerido",
          variant: "destructive"
        });
        return;
      }

      if (!formData.correo_electronico.trim()) {
        toast({
          title: "Error",
          description: "El correo electrónico es requerido",
          variant: "destructive"
        });
        return;
      }

      if (!formData.contrasena.trim()) {
        toast({
          title: "Error",
          description: "La contraseña es requerida",
          variant: "destructive"
        });
        return;
      }

      if (formData.contrasena !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
          variant: "destructive"
        });
        return;
      }

      if (!formData.rol_id) {
        toast({
          title: "Error",
          description: "Debe seleccionar un rol",
          variant: "destructive"
        });
        return;
      }

      const userData: CreateUserData = {
        nombre_completo: formData.nombre_completo,
        correo_electronico: formData.correo_electronico,
        contrasena: formData.contrasena,
        rol_id: parseInt(formData.rol_id),
        ciudad_id: formData.ciudad_id ? parseInt(formData.ciudad_id) : undefined
      };

      const response = await usersService.createUser(userData);

      if (response.success) {
        toast({
          title: "Usuario creado",
          description: `Usuario "${formData.nombre_completo}" creado exitosamente`,
        });

        // Reset form
        setFormData({
          nombre_completo: "",
          correo_electronico: "",
          contrasena: "",
          confirmPassword: "",
          rol_id: "",
          ciudad_id: ""
        });

        onOpenChange(false);
        onUserCreated?.();
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el usuario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Agrega un nuevo usuario al sistema con sus permisos correspondientes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre Completo *</Label>
            <Input
              id="nombre_completo"
              value={formData.nombre_completo}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correo_electronico">Correo Electrónico *</Label>
            <Input
              id="correo_electronico"
              type="email"
              value={formData.correo_electronico}
              onChange={(e) => setFormData(prev => ({ ...prev, correo_electronico: e.target.value }))}
              placeholder="Ej: juan.perez@miaumiau.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contrasena">Contraseña *</Label>
            <Input
              id="contrasena"
              type="password"
              value={formData.contrasena}
              onChange={(e) => setFormData(prev => ({ ...prev, contrasena: e.target.value }))}
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
              placeholder="Repite la contraseña"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol_id">Rol *</Label>
            <Select value={formData.rol_id} onValueChange={(value) => setFormData(prev => ({ ...prev, rol_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad_id">Ciudad (Opcional)</Label>
            <Input
              id="ciudad_id"
              type="number"
              value={formData.ciudad_id}
              onChange={(e) => setFormData(prev => ({ ...prev, ciudad_id: e.target.value }))}
              placeholder="ID de la ciudad (opcional)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;