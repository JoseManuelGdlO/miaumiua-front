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

interface CreatePromotionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePromotionModal = ({ open, onOpenChange }: CreatePromotionModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    type: "",
    discountType: "",
    discountValue: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    usageLimit: "",
    selectedCities: [] as string[],
    minPurchase: "",
    maxDiscount: ""
  });

  const cities = [
    "Bogotá", "Medellín", "Cali", "Barranquilla", 
    "Cartagena", "Bucaramanga", "Pereira", "Manizales"
  ];

  const promotionTypes = [
    { value: "percentage", label: "Porcentaje" },
    { value: "fixed_amount", label: "Monto Fijo" },
    { value: "product_discount", label: "Descuento en Producto" },
    { value: "category_discount", label: "Descuento por Categoría" },
    { value: "free_shipping", label: "Envío Gratis" },
    { value: "buy_get", label: "Compra X Lleva Y" },
    { value: "volume_discount", label: "Descuento por Volumen" }
  ];

  const handleCityToggle = (city: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCities: prev.selectedCities.includes(city)
        ? prev.selectedCities.filter(c => c !== city)
        : [...prev.selectedCities, city]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.type) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Selecciona las fechas de vigencia",
        variant: "destructive"
      });
      return;
    }

    if (formData.startDate >= formData.endDate) {
      toast({
        title: "Error", 
        description: "La fecha de inicio debe ser anterior a la fecha de fin",
        variant: "destructive"
      });
      return;
    }

    if (formData.selectedCities.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos una ciudad",
        variant: "destructive"
      });
      return;
    }

    console.log("Creando promoción:", formData);

    toast({
      title: "Promoción creada",
      description: `Promoción "${formData.name}" creada para ${formData.selectedCities.length} ciudades`,
    });

    // Reset form
    setFormData({
      name: "",
      code: "",
      description: "",
      type: "",
      discountType: "",
      discountValue: "",
      startDate: undefined,
      endDate: undefined,
      usageLimit: "",
      selectedCities: [],
      minPurchase: "",
      maxDiscount: ""
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Promoción</DialogTitle>
          <DialogDescription>
            Configura una nueva campaña promocional para productos Miau Miau
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Promoción *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Descuento Bienvenida"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código Promocional *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="BIENVENIDO15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe los términos y condiciones de la promoción..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Promoción *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {promotionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">Valor del Descuento *</Label>
                <Input
                  id="discountValue"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                  placeholder="15 o 15000"
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
                        "justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
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
                        "justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Límite de Uso</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                  placeholder="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPurchase">Compra Mínima ($)</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData(prev => ({ ...prev, minPurchase: e.target.value }))}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Descuento Máximo ($)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: e.target.value }))}
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ciudades Aplicables *</Label>
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {cities.map((city) => (
                      <div key={city} className="flex items-center space-x-2">
                        <Checkbox
                          id={city}
                          checked={formData.selectedCities.includes(city)}
                          onCheckedChange={() => handleCityToggle(city)}
                        />
                        <Label htmlFor={city} className="text-sm cursor-pointer">
                          {city}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear Promoción
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePromotionModal;