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

interface CreateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateCustomerModal = ({ open, onOpenChange }: CreateCustomerModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    catName: "",
    catAge: "",
    catBreed: "",
    preferredProduct: "",
    channel: "",
    loyaltyPoints: "",
    notes: "",
    birthDate: "",
    gender: ""
  });

  const cities = [
    "Ciudad de México", "Guadalajara", "Monterrey", "Puebla",
    "Tijuana", "León", "Mérida", "Zapopan"
  ];

  const channels = [
    { value: "whatsapp", label: "WhatsApp" },
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "web", label: "Página Web" },
    { value: "referral", label: "Referido" },
    { value: "phone", label: "Teléfono" }
  ];

  const products = [
    "Arena Premium 10kg",
    "Arena Antibacterial 5kg", 
    "Arena Perfumada 15kg",
    "Arena Básica 8kg",
    "Arena Ultra 12kg",
    "Arena Control de Olores 10kg"
  ];

  const catBreeds = [
    "Mestizo/Criollo",
    "Persa",
    "Siamés", 
    "British Shorthair",
    "Maine Coon",
    "Ragdoll",
    "Scottish Fold",
    "Bengala",
    "Angora",
    "Otro"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.city) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Error",
        description: "El email no tiene un formato válido",
        variant: "destructive"
      });
      return;
    }

    if (!/^\+57\s?\d{3}\s?\d{3}\s?\d{4}$/.test(formData.phone.replace(/\s/g, ''))) {
      toast({
        title: "Error", 
        description: "El teléfono debe tener formato colombiano: +57 XXX XXX XXXX",
        variant: "destructive"
      });
      return;
    }

    console.log("Creando cliente:", formData);

    toast({
      title: "Cliente registrado",
      description: `${formData.name} ha sido agregado a la base de datos`,
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      city: "",
      address: "",
      catName: "",
      catAge: "",
      catBreed: "",
      preferredProduct: "",
      channel: "",
      loyaltyPoints: "",
      notes: "",
      birthDate: "",
      gender: ""
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Agrega un nuevo cliente al sistema Miau Miau con información de su mascota
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <h4 className="font-medium text-sm border-b pb-2">Información Personal</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="María Elena González"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+57 320 123 4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="maria.gonzalez@gmail.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>Canal de Contacto</Label>
                <Select value={formData.channel} onValueChange={(value) => setFormData(prev => ({ ...prev, channel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="¿Cómo nos contactó?" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((channel) => (
                      <SelectItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección de Entrega</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Calle 123 #45-67, Apto 8B"
              />
            </div>

            <h4 className="font-medium text-sm border-b pb-2 mt-6">Información de la Mascota</h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="catName">Nombre del Gato</Label>
                <Input
                  id="catName"
                  value={formData.catName}
                  onChange={(e) => setFormData(prev => ({ ...prev, catName: e.target.value }))}
                  placeholder="Pelusa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catAge">Edad (años)</Label>
                <Input
                  id="catAge"
                  type="number"
                  value={formData.catAge}
                  onChange={(e) => setFormData(prev => ({ ...prev, catAge: e.target.value }))}
                  placeholder="3"
                  min="0"
                  max="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Macho</SelectItem>
                    <SelectItem value="female">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Raza</Label>
                <Select value={formData.catBreed} onValueChange={(value) => setFormData(prev => ({ ...prev, catBreed: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar raza" />
                  </SelectTrigger>
                  <SelectContent>
                    {catBreeds.map((breed) => (
                      <SelectItem key={breed} value={breed}>
                        {breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Producto Preferido</Label>
                <Select value={formData.preferredProduct} onValueChange={(value) => setFormData(prev => ({ ...prev, preferredProduct: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loyaltyPoints">Puntos de Lealtad Iniciales</Label>
              <Input
                id="loyaltyPoints"
                type="number"
                value={formData.loyaltyPoints}
                onChange={(e) => setFormData(prev => ({ ...prev, loyaltyPoints: e.target.value }))}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Especiales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Preferencias especiales, alergias, horarios de entrega, etc..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCustomerModal;