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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { promotionsService, Promotion } from "@/services/promotionsService";
import { citiesService, City } from "@/services/citiesService";

interface EditPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promotion: Promotion;
}

const EditPromotionModal = ({ isOpen, onClose, onSuccess, promotion }: EditPromotionModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    tipo_promocion: "",
    valor_descuento: "",
    fecha_inicio: undefined as Date | undefined,
    fecha_fin: undefined as Date | undefined,
    limite_uso: "",
    compra_minima: "",
    descuento_maximo: "",
    ciudades: [] as number[],
  });

  // Cargar ciudades
  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await citiesService.getAllCities({ activos: 'true' });
        setCities(response.data.cities);
      } catch (error) {
        console.error('Error al cargar ciudades:', error);
      }
    };

    if (isOpen) {
      loadCities();
    }
  }, [isOpen]);

  // Inicializar formulario con datos de la promoción
  useEffect(() => {
    if (promotion && isOpen) {
      setFormData({
        nombre: promotion.nombre,
        codigo: promotion.codigo,
        descripcion: promotion.descripcion || "",
        tipo_promocion: promotion.tipo_promocion,
        valor_descuento: promotion.valor_descuento.toString(),
        fecha_inicio: new Date(promotion.fecha_inicio),
        fecha_fin: new Date(promotion.fecha_fin),
        limite_uso: promotion.limite_uso.toString(),
        compra_minima: promotion.compra_minima?.toString() || "",
        descuento_maximo: promotion.descuento_maximo?.toString() || "",
        ciudades: promotion.ciudades?.map(c => c.id) || [],
      });
    }
  }, [promotion, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast({
        title: "Error",
        description: "Por favor selecciona las fechas de inicio y fin",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.fecha_inicio) >= new Date(formData.fecha_fin)) {
      toast({
        title: "Error",
        description: "La fecha de fin debe ser posterior a la fecha de inicio",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const updateData = {
        nombre: formData.nombre,
        codigo: formData.codigo,
        descripcion: formData.descripcion || undefined,
        tipo_promocion: formData.tipo_promocion as any,
        valor_descuento: parseFloat(formData.valor_descuento),
        fecha_inicio: formData.fecha_inicio.toISOString(),
        fecha_fin: formData.fecha_fin.toISOString(),
        limite_uso: parseInt(formData.limite_uso),
        compra_minima: formData.compra_minima ? parseFloat(formData.compra_minima) : undefined,
        descuento_maximo: formData.descuento_maximo ? parseFloat(formData.descuento_maximo) : undefined,
        ciudades: formData.ciudades,
      };

      await promotionsService.updatePromotion(promotion.id, updateData);
      
      toast({
        title: "Éxito",
        description: "Promoción actualizada correctamente",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al actualizar promoción:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la promoción",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCityToggle = (cityId: number) => {
    setFormData(prev => ({
      ...prev,
      ciudades: prev.ciudades.includes(cityId)
        ? prev.ciudades.filter(id => id !== cityId)
        : [...prev.ciudades, cityId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Promoción</DialogTitle>
          <DialogDescription>
            Modifica los datos de la promoción seleccionada
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre de la promoción"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                placeholder="CÓDIGO_PROMOCIÓN"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción de la promoción"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_promocion">Tipo de Promoción *</Label>
              <Select
                value={formData.tipo_promocion}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_promocion: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">Porcentaje</SelectItem>
                  <SelectItem value="monto_fijo">Monto Fijo</SelectItem>
                  <SelectItem value="envio_gratis">Envío Gratis</SelectItem>
                  <SelectItem value="descuento_especial">Descuento Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_descuento">Valor del Descuento *</Label>
              <Input
                id="valor_descuento"
                type="number"
                value={formData.valor_descuento}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_descuento: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.fecha_inicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fecha_inicio ? format(formData.fecha_inicio, "PPP") : "Selecciona fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.fecha_inicio}
                    onSelect={(date) => setFormData(prev => ({ ...prev, fecha_inicio: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Fecha de Fin *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.fecha_fin && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fecha_fin ? format(formData.fecha_fin, "PPP") : "Selecciona fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.fecha_fin}
                    onSelect={(date) => setFormData(prev => ({ ...prev, fecha_fin: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limite_uso">Límite de Uso</Label>
              <Input
                id="limite_uso"
                type="number"
                value={formData.limite_uso}
                onChange={(e) => setFormData(prev => ({ ...prev, limite_uso: e.target.value }))}
                placeholder="0 = Ilimitado"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compra_minima">Compra Mínima</Label>
              <Input
                id="compra_minima"
                type="number"
                value={formData.compra_minima}
                onChange={(e) => setFormData(prev => ({ ...prev, compra_minima: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descuento_maximo">Descuento Máximo</Label>
            <Input
              id="descuento_maximo"
              type="number"
              value={formData.descuento_maximo}
              onChange={(e) => setFormData(prev => ({ ...prev, descuento_maximo: e.target.value }))}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Ciudades Aplicables</Label>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {cities.map((city) => (
                    <div key={city.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`city-${city.id}`}
                        checked={formData.ciudades.includes(city.id)}
                        onCheckedChange={() => handleCityToggle(city.id)}
                      />
                      <Label
                        htmlFor={`city-${city.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {city.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar Promoción"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPromotionModal;
