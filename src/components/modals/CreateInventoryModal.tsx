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

interface CreateInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateInventoryModal = ({ open, onOpenChange }: CreateInventoryModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    product: "",
    sku: "",
    category: "",
    city: "",
    initialStock: "",
    minStock: "",
    maxStock: "",
    price: "",
    cost: "",
    supplier: "",
    weight: "",
    description: ""
  });

  const categories = [
    "Premium",
    "Ultra", 
    "Antibacterial",
    "Perfumada",
    "Básica",
    "Control de Olores",
    "Natural",
    "Biodegradable"
  ];

  const cities = [
    "Ciudad de México",
    "Guadalajara",
    "Monterrey", 
    "Puebla",
    "Tijuana",
    "León",
    "Mérida",
    "Zapopan"
  ];

  const suppliers = [
    "Proveedor Norte",
    "Distribuidora Centro", 
    "Logística Sur",
    "Mayorista Costa",
    "Proveedor Oriente",
    "Logística Centro"
  ];

  const weights = ["5kg", "8kg", "10kg", "12kg", "15kg", "20kg"];

  const generateSKU = () => {
    const categoryPrefix = formData.category.slice(0, 4).toUpperCase() || "PROD";
    const weightSuffix = formData.weight.replace("kg", "") || "00";
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `MM-${categoryPrefix}-${weightSuffix}-${randomNum}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product || !formData.category || !formData.city || !formData.price) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (parseInt(formData.minStock) >= parseInt(formData.maxStock)) {
      toast({
        title: "Error",
        description: "El stock mínimo debe ser menor al stock máximo",
        variant: "destructive"
      });
      return;
    }

    if (parseInt(formData.initialStock) > parseInt(formData.maxStock)) {
      toast({
        title: "Error",
        description: "El stock inicial no puede ser mayor al stock máximo",
        variant: "destructive"
      });
      return;
    }

    const finalSKU = formData.sku || generateSKU();

    console.log("Creando producto:", { ...formData, sku: finalSKU });

    toast({
      title: "Producto agregado",
      description: `${formData.product} agregado al inventario de ${formData.city}`,
    });

    // Reset form
    setFormData({
      product: "",
      sku: "",
      category: "",
      city: "",
      initialStock: "",
      minStock: "",
      maxStock: "",
      price: "",
      cost: "",
      supplier: "",
      weight: "",
      description: ""
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Producto al Inventario</DialogTitle>
          <DialogDescription>
            Registra un nuevo producto Miau Miau en el inventario por ciudad
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Nombre del Producto *</Label>
              <Input
                id="product"
                value={formData.product}
                onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                placeholder="Arena Miau Miau Premium 10kg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">Código SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                  placeholder="Autogenerado si se deja vacío"
                />
              </div>

              <div className="space-y-2">
                <Label>Peso *</Label>
                <Select value={formData.weight} onValueChange={(value) => setFormData(prev => ({ ...prev, weight: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar peso" />
                  </SelectTrigger>
                  <SelectContent>
                    {weights.map((weight) => (
                      <SelectItem key={weight} value={weight}>
                        {weight}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ciudad *</Label>
                <Select value={formData.city} onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Características especiales del producto..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialStock">Stock Inicial *</Label>
                <Input
                  id="initialStock"
                  type="number"
                  value={formData.initialStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, initialStock: e.target.value }))}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">Stock Mínimo *</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStock">Stock Máximo *</Label>
                <Input
                  id="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxStock: e.target.value }))}
                  placeholder="500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Costo Unitario ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="25000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio de Venta ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="45000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select value={formData.supplier} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Agregar Producto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInventoryModal;