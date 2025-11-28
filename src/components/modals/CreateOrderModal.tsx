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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ordersService, CreateOrderData } from "@/services/ordersService";
import { clientesService, Cliente } from "@/services/clientesService";
import { citiesService } from "@/services/citiesService";
import { Inventario } from "@/services/inventariosService";
import { Promotion } from "@/services/promotionsService";
import ProductSelector from "@/components/ui/ProductSelector";
import PackageSelector from "@/components/ui/PackageSelector";
import PromotionSelector from "@/components/ui/PromotionSelector";
import ClienteSelector from "@/components/ui/ClienteSelector";
import { packagesService } from "@/services/packagesService";
import type { Package } from "@/services/packagesService";
import { Loader2, Plus, Trash2, Package as PackageIcon, Package2, Calendar, MapPin, Phone, Mail, Tag } from "lucide-react";

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

interface ProductFormData {
  fkid_producto: number;
  cantidad: number;
  precio_unidad: number;
  descuento_producto: number;
  notas_producto: string;
  producto?: Inventario; // Para almacenar la información del producto seleccionado
}

interface PackageFormData {
  fkid_paquete: number;
  cantidad: number;
  precio_unidad: number;
  descuento_paquete: number;
  notas_paquete: string;
  paquete?: Package; // Para almacenar la información del paquete seleccionado
}

const CreateOrderModal = ({ open, onOpenChange, onOrderCreated }: CreateOrderModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [cities, setCities] = useState<Array<{ id: number; nombre: string; departamento: string }>>([]);
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const [packages, setPackages] = useState<PackageFormData[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  
  const [formData, setFormData] = useState({
    fkid_cliente: "",
    telefono_referencia: "",
    email_referencia: "",
    direccion_entrega: "",
    fkid_ciudad: "",
    fecha_entrega_estimada: "",
    metodo_pago: "",
    notas: "",
    codigo_promocion: ""
  });

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (open) {
      loadCities();
    }
  }, [open]);

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (open) {
      setFormData({
        fkid_cliente: "",
        telefono_referencia: "",
        email_referencia: "",
        direccion_entrega: "",
        fkid_ciudad: "",
        fecha_entrega_estimada: "",
        metodo_pago: "",
        notas: "",
        codigo_promocion: ""
      });
      setProducts([]);
      setPackages([]);
      setSelectedPromotion(null);
    }
  }, [open]);

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
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof ProductFormData, value: string | number | Inventario) => {
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

  const addPackage = () => {
    setPackages([...packages, {
      fkid_paquete: 0,
      cantidad: 1,
      precio_unidad: 0,
      descuento_paquete: 0,
      notas_paquete: "",
      paquete: undefined
    }]);
  };

  const removePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index));
  };

  const updatePackage = (index: number, field: keyof PackageFormData, value: string | number | Package) => {
    const updatedPackages = [...packages];
    updatedPackages[index] = { ...updatedPackages[index], [field]: value };
    setPackages(updatedPackages);
  };

  const handlePackageSelect = (index: number, pkg: Package | null) => {
    const updatedPackages = [...packages];
    
    if (pkg) {
      updatedPackages[index] = {
        ...updatedPackages[index],
        fkid_paquete: pkg.id,
        precio_unidad: Number(pkg.precio_final || 0),
        paquete: pkg
      };
    } else {
      updatedPackages[index] = {
        ...updatedPackages[index],
        fkid_paquete: 0,
        precio_unidad: 0,
        paquete: undefined
      };
    }
    
    setPackages(updatedPackages);
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

  const handleClientChange = (cliente: Cliente | null) => {
    if (cliente) {
      setSelectedCliente(cliente);
      setFormData(prev => ({
        ...prev,
        fkid_cliente: cliente.id.toString(),
        telefono_referencia: cliente.telefono,
        email_referencia: cliente.email || "",
        fkid_ciudad: cliente.fkid_ciudad.toString(),
        direccion_entrega: cliente.direccion_entrega || ""
      }));
    } else {
      setSelectedCliente(null);
      setFormData(prev => ({
        ...prev,
        fkid_cliente: "",
        telefono_referencia: "",
        email_referencia: "",
        fkid_ciudad: "",
        direccion_entrega: ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.fkid_cliente || !formData.direccion_entrega || !formData.fkid_ciudad || !formData.metodo_pago) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios: Cliente, Dirección, Ciudad y Método de Pago",
        variant: "destructive"
      });
      return;
    }

    // Validar que haya al menos un producto o paquete
    if (products.length === 0 && packages.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un producto o paquete al pedido",
        variant: "destructive"
      });
      return;
    }

    // Validar cada producto
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Debug: mostrar estado del producto
      console.log(`Producto ${i + 1}:`, {
        fkid_producto: product.fkid_producto,
        cantidad: product.cantidad,
        precio_unidad: product.precio_unidad,
        producto: product.producto,
        hasProducto: !!product.producto
      });
      
      // Validar que tenga un producto seleccionado
      if (!product.fkid_producto || !product.producto) {
        toast({
          title: "Error",
          description: `El producto ${i + 1} debe tener un producto seleccionado`,
          variant: "destructive"
        });
        return;
      }
      
      // Validar cantidad
      if (product.cantidad <= 0) {
        toast({
          title: "Error",
          description: `El producto ${i + 1} debe tener una cantidad válida`,
          variant: "destructive"
        });
        return;
      }
      
      // Validar que el precio sea válido (debe venir del inventario)
      if (Number(product.producto.precio_venta || 0) <= 0) {
        toast({
          title: "Error",
          description: `El producto ${i + 1} no tiene un precio válido del inventario`,
          variant: "destructive"
        });
        return;
      }
    }

    // Validar paquetes
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      
      if (!pkg.fkid_paquete || !pkg.paquete) {
        toast({
          title: "Error",
          description: `El paquete ${i + 1} debe tener un paquete seleccionado`,
          variant: "destructive"
        });
        return;
      }

      if (pkg.cantidad <= 0) {
        toast({
          title: "Error",
          description: `El paquete ${i + 1} debe tener una cantidad mayor a 0`,
          variant: "destructive"
        });
        return;
      }

      if (pkg.precio_unidad <= 0) {
        toast({
          title: "Error",
          description: `El paquete ${i + 1} debe tener un precio válido`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setLoading(true);

       const orderData: CreateOrderData = {
         fkid_cliente: parseInt(formData.fkid_cliente),
         telefono_referencia: formData.telefono_referencia || undefined,
         email_referencia: formData.email_referencia || undefined,
         direccion_entrega: formData.direccion_entrega,
         fkid_ciudad: parseInt(formData.fkid_ciudad),
         fecha_entrega_estimada: formData.fecha_entrega_estimada || undefined,
         metodo_pago: formData.metodo_pago as any,
         notas: formData.notas || undefined,
         codigo_promocion: formData.codigo_promocion || undefined,
         productos: products.length > 0 ? products.map(p => ({
           fkid_producto: p.fkid_producto,
           cantidad: p.cantidad,
           precio_unidad: p.precio_unidad,
           descuento_producto: p.descuento_producto,
           notas_producto: p.notas_producto || undefined
         })) : undefined,
         paquetes: packages.length > 0 ? packages.map(p => ({
           fkid_paquete: p.fkid_paquete,
           cantidad: p.cantidad,
           precio_unidad: p.precio_unidad,
           descuento_paquete: p.descuento_paquete,
           notas_paquete: p.notas_paquete || undefined
         })) : undefined
       };

      const response = await ordersService.createOrder(orderData);

      if (response.success) {
        toast({
          title: "Pedido creado",
          description: `Pedido #${response.data.pedido.numero_pedido} creado exitosamente`,
        });
        onOrderCreated();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error al crear pedido:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el pedido",
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Pedido</DialogTitle>
          <DialogDescription>
            Crea un nuevo pedido en el sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PackageIcon className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
              <CardDescription>
                Selecciona el cliente y completa la información de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fkid_cliente">Cliente *</Label>
                <ClienteSelector
                  value={formData.fkid_cliente || undefined}
                  onValueChange={handleClientChange}
                  placeholder="Buscar y seleccionar cliente..."
                  disabled={loading}
                />
              </div>

              {selectedCliente && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <PackageIcon className="h-4 w-4" />
                    <span className="font-medium">Cliente seleccionado:</span>
                  </div>
                  <div className="mt-2 text-sm text-blue-700">
                    <div><strong>Nombre:</strong> {selectedCliente.nombre_completo}</div>
                    <div><strong>Teléfono:</strong> {selectedCliente.telefono}</div>
                    {selectedCliente.email && <div><strong>Email:</strong> {selectedCliente.email}</div>}
                    {selectedCliente.ciudad && (
                      <div><strong>Ciudad:</strong> {selectedCliente.ciudad.nombre}, {selectedCliente.ciudad.departamento}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono_referencia">Teléfono de Referencia</Label>
                  <Input
                    id="telefono_referencia"
                    value={formData.telefono_referencia}
                    onChange={(e) => handleInputChange('telefono_referencia', e.target.value)}
                    placeholder="+584121234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_referencia">Email de Referencia</Label>
                  <Input
                    id="email_referencia"
                    type="email"
                    value={formData.email_referencia}
                    onChange={(e) => handleInputChange('email_referencia', e.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Información de Entrega
              </CardTitle>
              <CardDescription>
                Dirección y detalles de entrega
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="direccion_entrega">Dirección de Entrega *</Label>
                <Textarea
                  id="direccion_entrega"
                  value={formData.direccion_entrega}
                  onChange={(e) => handleInputChange('direccion_entrega', e.target.value)}
                  placeholder="Av. Principal, Edificio ABC, Piso 2, Apartamento 201"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fkid_ciudad">Ciudad *</Label>
                  <Select value={formData.fkid_ciudad} onValueChange={(value) => handleInputChange('fkid_ciudad', value)}>
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
                  <Label htmlFor="fecha_entrega_estimada">Fecha de Entrega Estimada</Label>
                  <Input
                    id="fecha_entrega_estimada"
                    type="datetime-local"
                    value={formData.fecha_entrega_estimada}
                    onChange={(e) => handleInputChange('fecha_entrega_estimada', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Información de Pago
              </CardTitle>
              <CardDescription>
                Método de pago y notas adicionales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metodo_pago">Método de Pago *</Label>
                <Select value={formData.metodo_pago} onValueChange={(value) => handleInputChange('metodo_pago', value)}>
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

               <div className="space-y-2">
                 <Label htmlFor="codigo_promocion">Código de Promoción</Label>
                 <PromotionSelector
                   value={formData.codigo_promocion || undefined}
                   onValueChange={handlePromotionSelect}
                   placeholder="Buscar y seleccionar promoción..."
                   disabled={loading}
                 />
                 {selectedPromotion && (
                   <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                     <div className="flex items-center gap-2 text-sm text-green-800">
                       <Tag className="h-4 w-4" />
                       <span className="font-medium">Promoción seleccionada:</span>
                     </div>
                     <div className="mt-2 text-sm text-green-700">
                       <div><strong>Nombre:</strong> {selectedPromotion.nombre}</div>
                       <div><strong>Código:</strong> {selectedPromotion.codigo}</div>
                       <div><strong>Descuento:</strong> {
                         selectedPromotion.tipo_promocion === 'porcentaje' 
                           ? `${selectedPromotion.valor_descuento}%`
                           : `$${selectedPromotion.valor_descuento}`
                       }</div>
                       {selectedPromotion.compra_minima && (
                         <div><strong>Compra mínima:</strong> ${selectedPromotion.compra_minima}</div>
                       )}
                     </div>
                   </div>
                 )}
               </div>

               <div className="space-y-2">
                 <Label htmlFor="notas">Notas Adicionales</Label>
                 <Textarea
                   id="notas"
                   value={formData.notas}
                   onChange={(e) => handleInputChange('notas', e.target.value)}
                   placeholder="Instrucciones especiales para la entrega..."
                   rows={3}
                 />
               </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PackageIcon className="h-5 w-5" />
                    Productos
                  </CardTitle>
                  <CardDescription>
                    Agrega los productos al pedido
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProduct}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PackageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">Haz clic en "Agregar Producto" para comenzar</p>
                </div>
              ) : (
                products.map((product, index) => (
                  <Card key={index} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Producto {index + 1}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(index)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Producto *</Label>
                        <ProductSelector
                          value={product.fkid_producto || undefined}
                          onValueChange={(selectedProduct) => handleProductSelect(index, selectedProduct)}
                          placeholder="Buscar y seleccionar producto..."
                          disabled={loading}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                           <Input
                             type="number"
                             min="1"
                             max={product.producto?.stock_inicial || 999}
                             value={product.cantidad}
                             onChange={(e) => updateProduct(index, 'cantidad', parseInt(e.target.value) || 1)}
                             placeholder="Cantidad"
                             required
                           />
                           {product.producto && (
                             <p className="text-xs text-muted-foreground">
                               Stock disponible: {product.producto.stock_inicial}
                             </p>
                           )}
                        </div>

                        <div className="space-y-2">
                          <Label>Precio por Unidad</Label>
                          {product.producto ? (
                            <div className="p-2 bg-gray-50 rounded border">
                              <div className="text-sm font-medium">
                                ${Number(product.producto.precio_venta || 0).toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Precio fijo del inventario
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 bg-gray-50 rounded border text-sm text-muted-foreground">
                              Selecciona un producto para ver el precio
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Descuento (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={product.descuento_producto}
                            onChange={(e) => updateProduct(index, 'descuento_producto', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Stock del Producto</Label>
                           <div className="p-2 bg-gray-50 rounded text-sm">
                             {product.producto ? (
                               <div>
                                 <strong>Stock:</strong> {product.producto.stock_inicial} unidades
                                 {product.producto.stock_inicial < product.cantidad && (
                                   <span className="text-red-600 ml-2">⚠️ Stock insuficiente</span>
                                 )}
                               </div>
                             ) : (
                               <span className="text-muted-foreground">Selecciona un producto</span>
                             )}
                           </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notas del Producto</Label>
                        <Textarea
                          value={product.notas_producto}
                          onChange={(e) => updateProduct(index, 'notas_producto', e.target.value)}
                          placeholder="Notas especiales para este producto..."
                          rows={2}
                        />
                      </div>

                      {product.cantidad > 0 && product.producto && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span><strong>Subtotal:</strong></span>
                              <span className="font-bold text-blue-800">
                                ${(product.cantidad * Number(product.producto.precio_venta || 0) * (1 - product.descuento_producto / 100)).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-blue-700">
                              {product.cantidad} × ${Number(product.producto.precio_venta || 0).toFixed(2)}
                              {product.descuento_producto > 0 && (
                                <span> - {product.descuento_producto}% descuento</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Paquetes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package2 className="h-5 w-5" />
                    Paquetes
                  </CardTitle>
                  <CardDescription>
                    Agrega paquetes al pedido (opcional)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPackage}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Paquete
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {packages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay paquetes agregados</p>
                  <p className="text-sm">Haz clic en "Agregar Paquete" para comenzar</p>
                </div>
              ) : (
                packages.map((pkg, index) => (
                  <Card key={index} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Paquete {index + 1}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePackage(index)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Paquete *</Label>
                        <PackageSelector
                          value={pkg.fkid_paquete || undefined}
                          onValueChange={(selectedPackage) => handlePackageSelect(index, selectedPackage)}
                          placeholder="Buscar y seleccionar paquete..."
                          disabled={loading}
                        />
                      </div>

                      {pkg.paquete && (
                        <div className="p-3 bg-muted rounded-lg space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{pkg.paquete.nombre}</span>
                            <Badge variant="secondary">
                              ${Number(pkg.paquete.precio_final).toLocaleString('es-CO')}
                            </Badge>
                          </div>
                          {pkg.paquete.descripcion && (
                            <p className="text-xs text-muted-foreground">{pkg.paquete.descripcion}</p>
                          )}
                          {pkg.paquete.productos && pkg.paquete.productos.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Incluye {pkg.paquete.productos.length} producto(s)
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={pkg.cantidad}
                            onChange={(e) => updatePackage(index, 'cantidad', parseInt(e.target.value) || 1)}
                            placeholder="Cantidad"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Precio por Unidad</Label>
                          {pkg.paquete ? (
                            <div className="p-2 bg-gray-50 rounded border">
                              <div className="text-sm font-medium">
                                ${Number(pkg.paquete.precio_final || 0).toLocaleString('es-CO')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Precio del paquete
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 bg-gray-50 rounded border text-sm text-muted-foreground">
                              Selecciona un paquete para ver el precio
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Descuento (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={pkg.descuento_paquete}
                            onChange={(e) => updatePackage(index, 'descuento_paquete', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Notas</Label>
                          <Input
                            type="text"
                            value={pkg.notas_paquete}
                            onChange={(e) => updatePackage(index, 'notas_paquete', e.target.value)}
                            placeholder="Notas adicionales..."
                          />
                        </div>
                      </div>

                      {pkg.paquete && pkg.cantidad > 0 && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Subtotal:</span>
                            <span className="text-sm font-bold">
                              ${((Number(pkg.paquete.precio_final) * pkg.cantidad) * (1 - (pkg.descuento_paquete / 100))).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                              {pkg.descuento_paquete > 0 && (
                                <span className="text-green-600"> - {pkg.descuento_paquete}% descuento</span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

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
              Crear Pedido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderModal;