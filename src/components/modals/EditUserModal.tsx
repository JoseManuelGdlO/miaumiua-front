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
import { usersService, User, UpdateUserData, Role } from "@/services/usersService";
import { rolesService } from "@/services/rolesService";
import { citiesService, City } from "@/services/citiesService";
import { Loader2 } from "lucide-react";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated?: () => void;
}

const EditUserModal = ({ open, onOpenChange, user, onUserUpdated }: EditUserModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo_electronico: "",
    rol_id: "",
    ciudad_id: "",
    isActive: true
  });

  // Cargar datos al abrir el modal o cuando cambia el usuario
  useEffect(() => {
    if (open && user) {
      loadData();
    }
  }, [open, user]);

  const loadData = async () => {
    try {
      // Cargar roles y ciudades en paralelo
      const [rolesResponse, citiesResponse] = await Promise.all([
        rolesService.getAllRoles({ activos: 'true' }),
        citiesService.getAllCities({ activos: 'true' })
      ]);

      if (rolesResponse.success) {
        setRoles(rolesResponse.data.roles);
      }

      if (citiesResponse.success) {
        setCities(citiesResponse.data.cities);
      }

      // Establecer los datos del formulario después de cargar roles y ciudades
      if (user) {
        setFormData({
          nombre_completo: user.nombre_completo || "",
          correo_electronico: user.correo_electronico || "",
          rol_id: user.rol_id?.toString() || "",
          ciudad_id: user.ciudad_id?.toString() || "",
          isActive: user.isActive ?? true
        });
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
    if (!user) return;

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

      if (!formData.rol_id) {
        toast({
          title: "Error",
          description: "Debe seleccionar un rol",
          variant: "destructive"
        });
        return;
      }

      const userData: UpdateUserData = {
        nombre_completo: formData.nombre_completo,
        correo_electronico: formData.correo_electronico,
        rol_id: parseInt(formData.rol_id),
        ciudad_id: formData.ciudad_id ? parseInt(formData.ciudad_id) : null,
        isActive: formData.isActive
      };

      const response = await usersService.updateUser(user.id, userData);

      if (response.success) {
        toast({
          title: "Usuario actualizado",
          description: `Usuario "${formData.nombre_completo}" actualizado exitosamente`,
        });

        onOpenChange(false);
        onUserUpdated?.();
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el usuario",
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
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica la información del usuario {user.nombre_completo}
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
            <Label htmlFor="rol_id">Rol *</Label>
            <Select 
              value={formData.rol_id || ""} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, rol_id: value }))}
            >
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
            <Select 
              value={formData.ciudad_id || "none"} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, ciudad_id: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin ciudad</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id.toString()}>
                    {city.nombre} - {city.departamento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="isActive" className="flex items-center space-x-2">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
              <span>Usuario activo</span>
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
                  Actualizando...
                </>
              ) : (
                "Actualizar Usuario"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;

