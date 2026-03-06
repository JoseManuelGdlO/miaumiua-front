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
import { citiesService, City, HORARIO_POR_DIA_DEFAULT, type HorarioPorDia } from "@/services/citiesService";
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
  const [formData, setFormData] = useState<{
    nombre: string;
    departamento: string;
    direccion_operaciones: string;
    manager: string;
    telefono: string;
    email_contacto: string;
    estado_inicial: City["estado_inicial"];
    max_pedidos_por_horario: number;
    dias_trabajo: number[];
    horario_por_dia: HorarioPorDia;
  }>({
    nombre: "",
    departamento: "",
    direccion_operaciones: "",
    manager: "",
    telefono: "",
    email_contacto: "",
    estado_inicial: "activa",
    max_pedidos_por_horario: 5,
    dias_trabajo: [1, 2, 3, 4, 5],
    horario_por_dia: { ...HORARIO_POR_DIA_DEFAULT } as HorarioPorDia,
  });

  // Construir horario_por_dia desde backend: si viene horario_por_dia usarlo; si no, desde campos legacy
  const getInitialHorarioPorDia = (c: City): HorarioPorDia => {
    const hasAllKeys = c.horario_por_dia && ['0','1','2','3','4','5','6'].every(k => c.horario_por_dia![k]);
    if (hasAllKeys) return { ...c.horario_por_dia! };
    const legacyInicio = c.hora_inicio_entrega ?? 9;
    const legacyFin = c.hora_fin_entrega ?? 18;
    const legacySlot = { inicio: legacyInicio, fin: legacyFin };
    const result: HorarioPorDia = {};
    for (let i = 0; i <= 6; i++) {
      const key = String(i);
      if (c.dias_trabajo && c.dias_trabajo.includes(i)) {
        result[key] = legacySlot;
      } else {
        result[key] = { ...HORARIO_POR_DIA_DEFAULT[key] };
      }
    }
    return result;
  };

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
        dias_trabajo: city.dias_trabajo && city.dias_trabajo.length > 0 ? city.dias_trabajo : [1, 2, 3, 4, 5],
        horario_por_dia: getInitialHorarioPorDia(city),
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

    if (!formData.dias_trabajo || formData.dias_trabajo.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un día de trabajo",
        variant: "destructive"
      });
      return;
    }

    // Validar horario por día: 0 <= inicio, fin <= 23 y inicio < fin
    const diasLabels: Record<string, string> = {
      '0': 'Domingo', '1': 'Lunes', '2': 'Martes', '3': 'Miércoles',
      '4': 'Jueves', '5': 'Viernes', '6': 'Sábado',
    };
    for (const key of ['0', '1', '2', '3', '4', '5', '6']) {
      const slot = formData.horario_por_dia[key];
      if (!slot) continue;
      const { inicio, fin } = slot;
      if (inicio < 0 || inicio > 23 || fin < 0 || fin > 23) {
        toast({
          title: "Error",
          description: `En ${diasLabels[key]}: hora inicio y fin deben estar entre 0 y 23`,
          variant: "destructive"
        });
        return;
      }
      if (inicio >= fin) {
        toast({
          title: "Error",
          description: `En ${diasLabels[key]}: la hora de inicio debe ser menor que la de fin`,
          variant: "destructive"
        });
        return;
      }
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

  const handleHorarioChange = (diaKey: string, field: 'inicio' | 'fin', value: number) => {
    setFormData(prev => ({
      ...prev,
      horario_por_dia: {
        ...prev.horario_por_dia,
        [diaKey]: {
          ...prev.horario_por_dia[diaKey],
          [field]: value,
        },
      },
    }));
  };

  const handleDiaTrabajoChange = (dia: number, checked: boolean) => {
    setFormData(prev => {
      const diasTrabajo = [...prev.dias_trabajo];
      if (checked) {
        if (!diasTrabajo.includes(dia)) diasTrabajo.push(dia);
      } else {
        const index = diasTrabajo.indexOf(dia);
        if (index > -1) diasTrabajo.splice(index, 1);
      }
      return { ...prev, dias_trabajo: diasTrabajo.sort((a, b) => a - b) };
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                  <Label htmlFor={`dia-${dia.value}`} className="text-sm font-normal cursor-pointer">
                    {dia.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Días en que la ciudad opera y realiza entregas (ej. lunes a viernes = [1,2,3,4,5])
            </p>
          </div>

          <div className="space-y-2">
            <Label>Horario por día</Label>
            <p className="text-sm text-muted-foreground">
              Hora de inicio y fin de atención por día (0-23). Inicio debe ser menor que fin.
            </p>
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_80px] gap-2 p-3 bg-muted/50 text-sm font-medium">
                <span>Día</span>
                <span>Inicio</span>
                <span>Fin</span>
              </div>
              {diasSemana
                .filter((dia) => formData.dias_trabajo.includes(dia.value))
                .map((dia) => {
                  const key = String(dia.value);
                  const slot = formData.horario_por_dia[key] ?? { inicio: 9, fin: 18 };
                  return (
                    <div
                      key={dia.value}
                      className="grid grid-cols-[1fr_80px_80px] gap-2 p-3 border-t items-center"
                    >
                      <span className="text-sm">{dia.label}</span>
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        value={slot.inicio}
                        onChange={(e) => handleHorarioChange(key, 'inicio', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        value={slot.fin}
                        onChange={(e) => handleHorarioChange(key, 'fin', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                  );
                })}
            </div>
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
