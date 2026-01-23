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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { citiesService, City } from "@/services/citiesService";
import { Loader2 } from "lucide-react";

interface EditCityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: City | null;
  onCityUpdated: () => void;
}

const EditCityModal = ({ open, onOpenChange, city, onCityUpdated }: EditCityModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    departamento: "",
    direccion_operaciones: "",
    manager: "",
    telefono: "",
    email_contacto: "",
    estado_inicial: "activa" as const,
    max_pedidos_por_horario: 5,
    dias_trabajo: [0, 1, 2, 3, 4, 5, 6] as number[]
  });

  // Actualizar formulario cuando cambie la ciudad
  useEffect(() => {
    if (city && open) {
      setFormData({
        nombre: city.nombre,
        departamento: city.departamento,
        direccion_operaciones: city.direccion_operaciones,
        manager: city.manager,
        telefono: city.telefono,
        email_contacto: city.email_contacto,
        estado_inicial: city.estado_inicial,
        max_pedidos_por_horario: city.max_pedidos_por_horario || 5,
        dias_trabajo: city.dias_trabajo && city.dias_trabajo.length > 0 
          ? city.dias_trabajo 
          : [0, 1, 2, 3, 4, 5, 6]
      });
    }
  }, [city, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!city) return;

    if (!formData.nombre || !formData.departamento || !formData.manager || !formData.telefono || !formData.email_contacto) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contacto)) {
      toast({
        title: "Error",
        description: "El email no tiene un formato válido",
        variant: "destructive"
      });
      return;
    }

    if (!/^[\+]?[0-9\s\-\(\)]+$/.test(formData.telefono)) {
      toast({
        title: "Error",
        description: "El teléfono no tiene un formato válido",
        variant: "destructive"
      });
      return;
    }

    // Validar max_pedidos_por_horario
    if (formData.max_pedidos_por_horario < 1 || formData.max_pedidos_por_horario > 100) {
      toast({
        title: "Error",
        description: "El máximo de pedidos por horario debe estar entre 1 y 100",
        variant: "destructive"
      });
      return;
    }

    // Validar que haya al menos un día de trabajo
    if (!formData.dias_trabajo || formData.dias_trabajo.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un día de trabajo",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const response = await citiesService.updateCity(city.id, formData);

      if (response.success) {
        toast({
          title: "Ciudad actualizada",
          description: `${formData.nombre} ha sido actualizada exitosamente`,
        });
        onCityUpdated();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error al actualizar ciudad:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar la ciudad",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDiaTrabajoChange = (dia: number, checked: boolean) => {
    setFormData(prev => {
      const diasTrabajo = [...prev.dias_trabajo];
      if (checked) {
        if (!diasTrabajo.includes(dia)) {
          diasTrabajo.push(dia);
        }
      } else {
        const index = diasTrabajo.indexOf(dia);
        if (index > -1) {
          diasTrabajo.splice(index, 1);
        }
      }
      return {
        ...prev,
        dias_trabajo: diasTrabajo.sort((a, b) => a - b)
      };
    });
  };

  const estados = [
    { value: "activa", label: "Activa" },
    { value: "inactiva", label: "Inactiva" },
    { value: "en_construccion", label: "En Construcción" },
    { value: "mantenimiento", label: "Mantenimiento" },
    { value: "suspendida", label: "Suspendida" }
  ];

  const diasSemana = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Ciudad</DialogTitle>
          <DialogDescription>
            Modifica la información de la ciudad de operación
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Ciudad *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Ej: Bogotá"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento *</Label>
              <Input
                id="departamento"
                value={formData.departamento}
                onChange={(e) => handleInputChange('departamento', e.target.value)}
                placeholder="Ej: Cundinamarca"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion_operaciones">Dirección de Operaciones</Label>
            <Input
              id="direccion_operaciones"
              value={formData.direccion_operaciones}
              onChange={(e) => handleInputChange('direccion_operaciones', e.target.value)}
              placeholder="Dirección completa de las operaciones"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager">Manager *</Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={(e) => handleInputChange('manager', e.target.value)}
                placeholder="Nombre del manager"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado_inicial">Estado Inicial</Label>
              <Select value={formData.estado_inicial} onValueChange={(value) => handleInputChange('estado_inicial', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="+57 1 234 5678"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_contacto">Email *</Label>
              <Input
                id="email_contacto"
                type="email"
                value={formData.email_contacto}
                onChange={(e) => handleInputChange('email_contacto', e.target.value)}
                placeholder="manager@miaumiau.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_pedidos_por_horario">Máximo de Pedidos por Horario *</Label>
            <Input
              id="max_pedidos_por_horario"
              type="number"
              min="1"
              max="100"
              value={formData.max_pedidos_por_horario}
              onChange={(e) => handleInputChange('max_pedidos_por_horario', parseInt(e.target.value) || 5)}
              placeholder="5"
              required
            />
            <p className="text-sm text-muted-foreground">
              Número máximo de pedidos que se pueden programar por horario (mañana o tarde)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Días de Trabajo *</Label>
            <div className="grid grid-cols-2 gap-3 p-4 border rounded-md">
              {diasSemana.map((dia) => (
                <div key={dia.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dia-${dia.value}`}
                    checked={formData.dias_trabajo.includes(dia.value)}
                    onCheckedChange={(checked) => handleDiaTrabajoChange(dia.value, checked as boolean)}
                  />
                  <Label
                    htmlFor={`dia-${dia.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {dia.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Selecciona los días de la semana en que se realizan entregas
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
              Actualizar Ciudad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCityModal;
