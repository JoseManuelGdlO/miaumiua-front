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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CreateCityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateCityModal = ({ open, onOpenChange }: CreateCityModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    status: "",
    deliveryZones: "",
    address: "",
    manager: "",
    phone: "",
    email: "",
    avgDeliveryTime: "",
    coverageArea: "",
    operatingHours: "",
    notes: ""
  });

  const departments = [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
    "Chihuahua", "CDMX", "Coahuila", "Colima", "Durango",
    "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
    "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
    "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
    "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala",
    "Veracruz", "Yucatán", "Zacatecas"
  ];

  const statuses = [
    { value: "planning", label: "Planificada" },
    { value: "evaluation", label: "En Evaluación" },
    { value: "active", label: "Activa" },
    { value: "paused", label: "Pausada" },
    { value: "inactive", label: "Inactiva" }
  ];

  const deliveryTimes = [
    "1-2 días", "2-3 días", "2-4 días", "3-5 días", "1-3 días", "Mismo día"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.department || !formData.status) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (formData.phone && !/^\+57\s\d{3}\s\d{3}\s\d{4}$/.test(formData.phone)) {
      toast({
        title: "Error",
        description: "El teléfono debe tener el formato: +57 XXX XXX XXXX",
        variant: "destructive"
      });
      return;
    }

    console.log("Creando ciudad:", formData);

    toast({
      title: "Ciudad agregada",
      description: `${formData.name}, ${formData.department} ha sido agregada al sistema`,
    });

    // Reset form
    setFormData({
      name: "",
      department: "",
      status: "",
      deliveryZones: "",
      address: "",
      manager: "",
      phone: "",
      email: "",
      avgDeliveryTime: "",
      coverageArea: "",
      operatingHours: "",
      notes: ""
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Ciudad</DialogTitle>
          <DialogDescription>
            Configura una nueva ciudad para operaciones Miau Miau y define sus zonas de cobertura
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Ciudad *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Villavicencio"
                />
              </div>

              <div className="space-y-2">
                <Label>Departamento *</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección de Operaciones</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Calle 100 #15-20, Zona Norte"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado Inicial *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryZones">Número de Zonas de Entrega</Label>
                <Input
                  id="deliveryZones"
                  type="number"
                  value={formData.deliveryZones}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryZones: e.target.value }))}
                  placeholder="5"
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverageArea">Área de Cobertura</Label>
              <Textarea
                id="coverageArea"
                value={formData.coverageArea}
                onChange={(e) => setFormData(prev => ({ ...prev, coverageArea: e.target.value }))}
                placeholder="Describe las zonas, barrios o sectores que se cubrirán..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiempo Promedio de Entrega</Label>
                <Select value={formData.avgDeliveryTime} onValueChange={(value) => setFormData(prev => ({ ...prev, avgDeliveryTime: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tiempo" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operatingHours">Horario de Atención</Label>
                <Input
                  id="operatingHours"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, operatingHours: e.target.value }))}
                  placeholder="8:00 AM - 6:00 PM"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm">Manager de Ciudad</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manager">Nombre del Manager</Label>
                  <Input
                    id="manager"
                    value={formData.manager}
                    onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                    placeholder="María Elena Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+57 301 234 5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email de Contacto</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="manager.ciudad@miaumiau.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Información adicional, restricciones especiales, etc..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Agregar Ciudad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCityModal;