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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { clientesService, Cliente } from "@/services/clientesService";
import { citiesService } from "@/services/citiesService";
import { Loader2 } from "lucide-react";

interface EditCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
  onClienteUpdated: () => void;
}

const EditCustomerModal = ({ open, onOpenChange, cliente, onClienteUpdated }: EditCustomerModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<Array<{ id: number; nombre: string; departamento: string }>>([]);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo_electronico: "",
    ciudad_id: "",
    contrasena: ""
  });

  // Cargar ciudades al abrir el modal
  useEffect(() => {
    if (open) {
      loadCities();
    }
  }, [open]);

  // Actualizar formulario cuando cambie el cliente
  useEffect(() => {
    if (cliente && open) {
      setFormData({
        nombre_completo: cliente.nombre_completo,
        correo_electronico: cliente.correo_electronico,
        ciudad_id: cliente.ciudad_id.toString(),
        contrasena: ""
      });
    }
  }, [cliente, open]);

  const loadCities = async () => {
    try {
      const response = await citiesService.getAllCities();
      if (response.success) {
        setCities(response.data.cities);
      }
    } catch (error) {
      console.error('Error al cargar ciudades:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente) return;

    if (!formData.nombre_completo || !formData.correo_electronico || !formData.ciudad_id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_electronico)) {
      toast({
        title: "Error",
        description: "El email no tiene un formato válido",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const updateData: any = {
        nombre_completo: formData.nombre_completo,
        correo_electronico: formData.correo_electronico,
        ciudad_id: parseInt(formData.ciudad_id)
      };

      // Solo incluir contraseña si se proporciona
      if (formData.contrasena.trim()) {
        updateData.contrasena = formData.contrasena;
      }

      const response = await clientesService.updateCliente(cliente.id, updateData);

      if (response.success) {
        toast({
          title: "Cliente actualizado",
          description: `${formData.nombre_completo} ha sido actualizado exitosamente`,
        });
        onClienteUpdated();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el cliente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Modifica la información del cliente. Deja la contraseña vacía para mantener la actual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_completo">Nombre Completo *</Label>
              <Input
                id="nombre_completo"
                value={formData.nombre_completo}
                onChange={(e) => handleInputChange('nombre_completo', e.target.value)}
                placeholder="Nombre completo del cliente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo_electronico">Correo Electrónico *</Label>
              <Input
                id="correo_electronico"
                type="email"
                value={formData.correo_electronico}
                onChange={(e) => handleInputChange('correo_electronico', e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad_id">Ciudad *</Label>
            <Select value={formData.ciudad_id} onValueChange={(value) => handleInputChange('ciudad_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una ciudad" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id.toString()}>
                    {city.nombre} - {city.departamento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contrasena">Nueva Contraseña</Label>
            <Input
              id="contrasena"
              type="password"
              value={formData.contrasena}
              onChange={(e) => handleInputChange('contrasena', e.target.value)}
              placeholder="Deja vacío para mantener la actual"
            />
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
              Actualizar Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerModal;
