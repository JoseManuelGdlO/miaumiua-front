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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const CreateOrderModal = ({ open, onOpenChange }: CreateOrderModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customer: "",
    phone: "",
    email: "", 
    address: "",
    city: "",
    zone: "",
    deliveryDate: undefined as Date | undefined,
    paymentMethod: "",
    orderOrigin: "",
    createdBy: "",
    comments: "",
    urgentDelivery: false
  });

  const [products, setProducts] = useState<OrderProduct[]>([
    { id: "1", name: "", quantity: 1, price: 0 }
  ]);

  const cities = [
    "Ciudad de México", "Guadalajara", "Monterrey", "Puebla",
    "Tijuana", "León", "Mérida", "Zapopan"
  ];

  const zones = {
    "Ciudad de México": ["Polanco", "Roma Norte", "Condesa", "Centro", "Del Valle", "Santa Fe"],
    "Guadalajara": ["Providencia", "Chapultepec", "Centro", "Americana", "Vallarta Norte"],
    "Monterrey": ["San Pedro", "Centro", "Santa Catarina", "Valle Oriente", "Cumbres"],
    "Puebla": ["Centro", "Angelópolis", "La Paz", "Reforma", "Zavaleta"],
    "Tijuana": ["Zona Río", "Centro", "Otay", "La Mesa", "Playas"],
    "León": ["Centro", "Del Valle", "Lomas del Campestre", "San Jerónimo", "Jardines"],
    "Mérida": ["Centro", "Norte", "García Ginerés", "Montejo", "Itzimná"],
    "Zapopan": ["Centro", "Real del Country", "Puerta de Hierro", "Vallarta", "Plaza del Sol"]
  };

  const availableProducts = [
    { name: "Arena Premium 10kg", price: 45000 },
    { name: "Arena Antibacterial 5kg", price: 28000 },
    { name: "Arena Perfumada 15kg", price: 52000 },
    { name: "Arena Básica 8kg", price: 18000 },
    { name: "Arena Ultra 12kg", price: 58000 },
    { name: "Arena Control de Olores 10kg", price:35000 },
    { name: "Arena Natural 5kg", price: 22000 },
    { name: "Arena Biodegradable 8kg", price: 48000 }
  ];

  const paymentMethods = [
    "Efectivo",
    "Tarjeta de Crédito", 
    "Tarjeta Débito",
    "Transferencia Bancaria",
    "Nequi",
    "Daviplata",
    "PSE"
  ];

  const orderOrigins = [
    "WhatsApp",
    "Instagram",
    "Facebook",
    "Página Web",
    "Teléfono",
    "Presencial", 
    "Referido",
    "Chatbot IA",
    "App Móvil"
  ];

  const users = [
    "Ana García (Administrador)",
    "Carlos Mendoza (Supervisor Ventas)",
    "Laura Rodríguez (Agente Chat)",
    "Miguel Torres (Inventario)",
    "Sofia Valencia (Agente Chat)",
    "Diego Morales (Supervisor Técnico)"
  ];

  const addProduct = () => {
    setProducts(prev => [...prev, { 
      id: Date.now().toString(), 
      name: "", 
      quantity: 1, 
      price: 0 
    }]);
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof OrderProduct, value: string | number) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleProductSelect = (id: string, productName: string) => {
    const selectedProduct = availableProducts.find(p => p.name === productName);
    if (selectedProduct) {
      updateProduct(id, "name", selectedProduct.name);
      updateProduct(id, "price", selectedProduct.price);
    }
  };

  const calculateTotal = () => {
    return products.reduce((total, product) => {
      return total + (product.quantity * product.price);
    }, 0);
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `MM-${year}-${randomNum}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer || !formData.phone || !formData.address || !formData.city) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios del cliente",
        variant: "destructive"
      });
      return;
    }

    if (!formData.deliveryDate) {
      toast({
        title: "Error",
        description: "Selecciona una fecha de entrega",
        variant: "destructive"
      });
      return;
    }

    const validProducts = products.filter(p => p.name && p.quantity > 0);
    if (validProducts.length === 0) {
      toast({
        title: "Error",
        description: "Agrega al menos un producto válido al pedido",
        variant: "destructive"
      });
      return;
    }

    if (!formData.paymentMethod || !formData.orderOrigin || !formData.createdBy) {
      toast({
        title: "Error",
        description: "Por favor completa la información del pedido",
        variant: "destructive"
      });
      return;
    }

    const orderData = {
      orderNumber: generateOrderNumber(),
      ...formData,
      products: validProducts,
      total: calculateTotal(),
      orderDate: format(new Date(), "yyyy-MM-dd"),
      status: "Pendiente",
      modifiedBy: formData.createdBy, // Initially same as creator
      modifiedDate: format(new Date(), "yyyy-MM-dd HH:mm:ss")
    };

    console.log("Creando pedido:", orderData);

    toast({
      title: "Pedido creado",
      description: `Pedido ${orderData.orderNumber} creado por ${calculateTotal().toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`,
    });

    // Reset form
    setFormData({
      customer: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      zone: "",
      deliveryDate: undefined,
      paymentMethod: "",
      orderOrigin: "",
      createdBy: "",
      comments: "",
      urgentDelivery: false
    });
    setProducts([{ id: "1", name: "", quantity: 1, price: 0 }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Crear Nuevo Pedido
          </DialogTitle>
          <DialogDescription>
            Registra un nuevo pedido de arena para gatos Miau Miau
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Nombre Completo *</Label>
                  <Input
                    id="customer"
                    value={formData.customer}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
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

              <div className="space-y-2">
                <Label htmlFor="address">Dirección de Entrega *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Calle 127 #15-45, Apto 502"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciudad *</Label>
                  <Select value={formData.city} onValueChange={(value) => setFormData(prev => ({ ...prev, city: value, zone: "" }))}>
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
                  <Label>Zona</Label>
                  <Select 
                    value={formData.zone} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, zone: value }))}
                    disabled={!formData.city}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.city && zones[formData.city as keyof typeof zones]?.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Productos del Pedido</CardTitle>
                <Button type="button" size="sm" onClick={addProduct}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.map((product, index) => (
                <div key={product.id} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                  <div className="col-span-5 space-y-2">
                    <Label>Producto</Label>
                    <Select 
                      value={product.name} 
                      onValueChange={(value) => handleProductSelect(product.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((p) => (
                          <SelectItem key={p.name} value={p.name}>
                            {p.name} - ${p.price.toLocaleString('es-CO')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProduct(product.id, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="col-span-3 space-y-2">
                    <Label>Precio Unit.</Label>
                    <Input
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProduct(product.id, "price", parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <Label>Total</Label>
                    <div className="font-medium text-sm">
                      ${(product.quantity * product.price).toLocaleString('es-CO')}
                    </div>
                  </div>

                  <div className="col-span-1">
                    {products.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total del pedido</div>
                  <div className="text-xl font-bold text-primary">
                    ${calculateTotal().toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Entrega *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !formData.deliveryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deliveryDate ? format(formData.deliveryDate, "PPP") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.deliveryDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, deliveryDate: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Método de Pago *</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origen del Pedido *</Label>
                  <Select value={formData.orderOrigin} onValueChange={(value) => setFormData(prev => ({ ...prev, orderOrigin: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="¿Desde dónde se creó?" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderOrigins.map((origin) => (
                        <SelectItem key={origin} value={origin}>
                          {origin}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Creado por *</Label>
                  <Select value={formData.createdBy} onValueChange={(value) => setFormData(prev => ({ ...prev, createdBy: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user} value={user}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {user}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Comentarios Especiales</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Instrucciones especiales, horarios preferidos, referencias adicionales..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear Pedido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderModal;