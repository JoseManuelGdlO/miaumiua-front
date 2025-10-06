import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  Package,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
  X,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ordersService, Order, UpdateOrderData } from "@/services/ordersService";
import { clientesService, Cliente } from "@/services/clientesService";
import { citiesService, City } from "@/services/citiesService";
import { inventariosService, Inventario } from "@/services/inventariosService";
import { promotionsService, Promotion } from "@/services/promotionsService";
import ProductSelector from "@/components/ui/ProductSelector";
import PromotionSelector from "@/components/ui/PromotionSelector";

interface ProductFormData {
  id?: number;
  fkid_producto: number;
  cantidad: number;
  precio_unidad: number;
  descuento_producto: number;
  notas_producto: string;
  producto?: Inventario;
}

interface EditOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onOrderUpdated: () => void;
}

const EditOrderModal = ({ open, onOpenChange, order, onOrderUpdated }: EditOrderModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState({
    fkid_cliente: "",
    telefono_referencia: "",
    email_referencia: "",
    fkid_ciudad: "",
    direccion_entrega: "",
    fecha_entrega_estimada: "",
    metodo_pago: "efectivo" as "efectivo" | "tarjeta" | "transferencia" | "pago_movil",
    notas: "",
    codigo_promocion: ""
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  // Cargar datos del pedido cuando cambie
  useEffect(() => {
    if (order && open) {
      loadOrderData();
    }
  }, [order, open]);

  const loadInitialData = async () => {
    try {
      const [clientsResponse, citiesResponse] = await Promise.all([
        clientesService.getAllClientes({ page: 1, limit: 100 }),
        citiesService.getAllCities({ page: 1, limit: 100 })
      ]);

      setClients(clientsResponse.data.clientes || []);
      setCities(citiesResponse.data.cities || []);
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        variant: "destructive"
      });
    }
  };

  const loadOrderData = () => {
    if (!order) return;

    // Cargar datos del formulario
    setFormData({
      fkid_cliente: order.fkid_cliente.toString(),
      telefono_referencia: order.telefono_referencia || "",
      email_referencia: order.email_referencia || "",
      fkid_ciudad: order.fkid_ciudad.toString(),
      direccion_entrega: order.direccion_entrega,
      fecha_entrega_estimada: order.fecha_entrega_estimada ? 
        new Date(order.fecha_entrega_estimada).toISOString().slice(0, 16) : "",
      metodo_pago: order.metodo_pago,
      notas: order.notas || "",
      codigo_promocion: ""
    });

    // Cargar productos del pedido
    if (order.productos && order.productos.length > 0) {
      const orderProducts: ProductFormData[] = order.productos.map(product => ({
        id: product.id,
        fkid_producto: product.fkid_producto,
        cantidad: product.cantidad,
        precio_unidad: product.precio_unidad,
        descuento_producto: product.descuento_producto || 0,
        notas_producto: product.notas_producto || "",
        producto: product.producto ? {
          id: product.producto.id,
          nombre: product.producto.nombre,
          descripcion: product.producto.descripcion || "",
          precio_venta: product.precio_unidad.toString(),
          stock_inicial: 0,
          categoria: { id: 0, nombre: "", descripcion: "" },
          ciudad: { id: 0, nombre: "", departamento: "" },
          peso: { id: 0, cantidad: "0", unidad_medida: "kg" },
          proveedor: { id: 0, nombre: "", correo: "", telefono: "" },
          sku: "",
          costo_unitario: "0",
          stock_maximo: 0,
          stock_minimo: 0,
          fkid_categoria: 0,
          fkid_ciudad: 0,
          fkid_peso: 0,
          fkid_proveedor: 0,
          baja_logica: false,
          created_at: "",
          updated_at: ""
        } : undefined
      }));
      setProducts(orderProducts);
    } else {
      setProducts([]);
    }

    // Cargar promoción si existe
    if (order.codigo_promocion) {
      // Aquí podrías cargar la promoción específica si es necesario
      setSelectedPromotion(null);
    } else {
      setSelectedPromotion(null);
    }
  };

  const addProduct = () => {
    setProducts([...products, {
      fkid_producto: 0,
      cantidad: 1,
      precio_unidad: 0,
      descuento_producto: 0,
      notas_producto: "",
      producto: undefined
    }]);
  };

  const removeProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };

  const updateProduct = (index: number, field: keyof ProductFormData, value: any) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setProducts(updatedProducts);
  };

  const handleProductSelect = (index: number, product: Inventario | null) => {
    const updatedProducts = [...products];
    
    if (product) {
      updatedProducts[index] = {
        ...updatedProducts[index],
        fkid_producto: product.id,
        precio_unidad: Number(product.precio_venta || 0),
        producto: product
      };
    } else {
      updatedProducts[index] = {
        ...updatedProducts[index],
        fkid_producto: 0,
        precio_unidad: 0,
        producto: undefined
      };
    }
    
    setProducts(updatedProducts);
  };

  const handlePromotionSelect = (promotion: Promotion | null) => {
    setSelectedPromotion(promotion);
    if (promotion) {
      setFormData(prev => ({
        ...prev,
        codigo_promocion: promotion.codigo
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        codigo_promocion: ""
      }));
    }
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id.toString() === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        fkid_cliente: clientId,
        telefono_referencia: client.telefono,
        email_referencia: client.email || "",
        fkid_ciudad: client.fkid_ciudad.toString(),
        direccion_entrega: client.direccion_entrega || ""
      }));
    }
  };

  const calculateSubtotal = () => {
    return products.reduce((total, product) => {
      const subtotal = product.cantidad * product.precio_unidad;
      const discount = (subtotal * product.descuento_producto) / 100;
      return total + (subtotal - discount);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    // Aquí podrías aplicar descuentos de promoción si es necesario
    return subtotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order) return;

    // Validaciones básicas
    if (!formData.fkid_cliente || !formData.direccion_entrega || !formData.fkid_ciudad || !formData.metodo_pago) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios: Cliente, Dirección, Ciudad y Método de Pago",
        variant: "destructive"
      });
      return;
    }

    // Validar productos
    if (products.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un producto al pedido",
        variant: "destructive"
      });
      return;
    }

    // Validar cada producto
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (!product.fkid_producto || !product.producto) {
        toast({
          title: "Error",
          description: `El producto ${i + 1} debe tener un producto seleccionado`,
          variant: "destructive"
        });
        return;
      }
      
      if (product.cantidad <= 0) {
        toast({
          title: "Error",
          description: `El producto ${i + 1} debe tener una cantidad válida`,
          variant: "destructive"
        });
        return;
      }
      
      if (Number(product.producto.precio_venta || 0) <= 0) {
        toast({
          title: "Error",
          description: `El producto ${i + 1} no tiene un precio válido del inventario`,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      const updateData: UpdateOrderData = {
        fkid_cliente: parseInt(formData.fkid_cliente),
        telefono_referencia: formData.telefono_referencia || undefined,
        email_referencia: formData.email_referencia || undefined,
        direccion_entrega: formData.direccion_entrega,
        fkid_ciudad: parseInt(formData.fkid_ciudad),
        fecha_entrega_estimada: formData.fecha_entrega_estimada ? 
          new Date(formData.fecha_entrega_estimada).toISOString() : undefined,
        metodo_pago: formData.metodo_pago,
        notas: formData.notas || undefined,
        codigo_promocion: formData.codigo_promocion || undefined,
        productos: products.map(product => ({
          id: product.id, // Incluir ID para actualización
          fkid_producto: product.fkid_producto,
          cantidad: product.cantidad,
          precio_unidad: product.precio_unidad,
          descuento_producto: product.descuento_producto,
          notas_producto: product.notas_producto || undefined
        }))
      };

      await ordersService.updateOrder(order.id, updateData);

      toast({
        title: "Pedido actualizado",
        description: "El pedido ha sido actualizado exitosamente",
      });

      onOrderUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el pedido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Pedido #{order.numero_pedido}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fkid_cliente">Cliente *</Label>
                  <Select value={formData.fkid_cliente} onValueChange={handleClientChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.nombre_completo} - {client.telefono}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono_referencia">Teléfono de Referencia</Label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono_referencia"
                      value={formData.telefono_referencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono_referencia: e.target.value }))}
                      className="pl-8"
                      placeholder="Teléfono de contacto"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_referencia">Email de Referencia</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email_referencia"
                      type="email"
                      value={formData.email_referencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, email_referencia: e.target.value }))}
                      className="pl-8"
                      placeholder="Email de contacto"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fkid_ciudad">Ciudad *</Label>
                  <Select value={formData.fkid_ciudad} onValueChange={(value) => setFormData(prev => ({ ...prev, fkid_ciudad: value }))}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion_entrega">Dirección de Entrega *</Label>
                <div className="relative">
                  <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="direccion_entrega"
                    value={formData.direccion_entrega}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion_entrega: e.target.value }))}
                    className="pl-8"
                    placeholder="Dirección completa de entrega"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Información del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_entrega_estimada">Fecha de Entrega Estimada</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fecha_entrega_estimada"
                      type="datetime-local"
                      value={formData.fecha_entrega_estimada}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha_entrega_estimada: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodo_pago">Método de Pago *</Label>
                  <Select value={formData.metodo_pago} onValueChange={(value: any) => setFormData(prev => ({ ...prev, metodo_pago: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas Adicionales</Label>
                <div className="relative">
                  <FileText className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                    className="pl-8"
                    placeholder="Notas adicionales para el pedido"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promoción */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Promoción
              </CardTitle>
              <CardDescription>
                Selecciona una promoción para aplicar al pedido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromotionSelector
                selectedPromotion={selectedPromotion}
                onValueChange={handlePromotionSelect}
              />
              {selectedPromotion && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">{selectedPromotion.nombre}</p>
                      <p className="text-sm text-green-600">Código: {selectedPromotion.codigo}</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {selectedPromotion.tipo === 'porcentaje' ? `${selectedPromotion.valor}%` : `$${selectedPromotion.valor}`}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos
              </CardTitle>
              <CardDescription>
                Agrega los productos que incluye este pedido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.map((product, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Producto {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Producto *</Label>
                      <ProductSelector
                        selectedProduct={product.producto}
                        onValueChange={(selectedProduct) => handleProductSelect(index, selectedProduct)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`cantidad-${index}`}>Cantidad *</Label>
                      <Input
                        id={`cantidad-${index}`}
                        type="number"
                        min="1"
                        value={product.cantidad}
                        onChange={(e) => updateProduct(index, 'cantidad', parseInt(e.target.value) || 1)}
                        placeholder="Cantidad"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Precio por Unidad</Label>
                      <div className="p-2 bg-gray-50 border rounded text-sm">
                        {product.producto ? 
                          `$${Number(product.producto.precio_venta || 0).toFixed(2)}` : 
                          'Selecciona un producto'
                        }
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`descuento-${index}`}>Descuento (%)</Label>
                      <Input
                        id={`descuento-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        value={product.descuento_producto}
                        onChange={(e) => updateProduct(index, 'descuento_producto', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`notas-producto-${index}`}>Notas del Producto</Label>
                      <Input
                        id={`notas-producto-${index}`}
                        value={product.notas_producto}
                        onChange={(e) => updateProduct(index, 'notas_producto', e.target.value)}
                        placeholder="Notas específicas para este producto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Subtotal</Label>
                      <div className="p-2 bg-blue-50 border rounded text-sm font-medium">
                        {product.producto ? 
                          `$${((product.cantidad * Number(product.producto.precio_venta || 0)) * (1 - product.descuento_producto / 100)).toFixed(2)}` : 
                          '$0.00'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addProduct}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </CardContent>
          </Card>

          {/* Resumen del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                {selectedPromotion && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({selectedPromotion.nombre}):</span>
                    <span>-${(calculateSubtotal() * (selectedPromotion.tipo === 'porcentaje' ? selectedPromotion.valor / 100 : selectedPromotion.valor / calculateSubtotal())).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderModal;
