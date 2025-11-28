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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { packagesService, CreatePackageData, UpdatePackageData, Package } from "@/services/packagesService";
import { Inventario } from "@/services/inventariosService";
import ProductSelector from "@/components/ui/ProductSelector";
import { Loader2, Plus, Trash2, Package as PackageIcon, DollarSign, Percent } from "lucide-react";

interface CreatePackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPackageCreated: () => void;
  editingPackage?: Package | null;
}

interface ProductFormData {
  fkid_producto: number;
  cantidad: number;
  producto?: Inventario;
}

const CreatePackageModal = ({ open, onOpenChange, onPackageCreated, editingPackage }: CreatePackageModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const isEditing = !!editingPackage;
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    descuento: ""
  });

  // Reset form cuando se abre el modal o cambia el paquete a editar
  useEffect(() => {
    if (open) {
      if (editingPackage) {
        // Cargar datos del paquete a editar
        setFormData({
          nombre: editingPackage.nombre || "",
          descripcion: editingPackage.descripcion || "",
          precio: editingPackage.precio?.toString() || "",
          descuento: editingPackage.descuento?.toString() || ""
        });
        
        // Cargar productos del paquete
        if (editingPackage.productos && editingPackage.productos.length > 0) {
          setProducts(editingPackage.productos.map(p => ({
            fkid_producto: p.fkid_producto,
            cantidad: p.cantidad,
            producto: p.producto
          })));
        } else {
          setProducts([]);
        }
      } else {
        // Reset para crear nuevo
        setFormData({
          nombre: "",
          descripcion: "",
          precio: "",
          descuento: ""
        });
        setProducts([]);
      }
    }
  }, [open, editingPackage]);

  const addProduct = () => {
    setProducts([...products, {
      fkid_producto: 0,
      cantidad: 1,
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
        producto: product
      };
    } else {
      updatedProducts[index] = {
        ...updatedProducts[index],
        fkid_producto: 0,
        producto: undefined
      };
    }
    
    setProducts(updatedProducts);
  };

  const calculateSubtotal = () => {
    return products.reduce((sum, product) => {
      if (product.producto && product.cantidad > 0) {
        const precio = Number(product.producto.precio_venta || 0);
        return sum + (precio * product.cantidad);
      }
      return sum;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = Number(formData.precio) || calculateSubtotal();
    const descuentoPorcentaje = Number(formData.descuento) || 0;
    const descuentoAmount = (subtotal * descuentoPorcentaje) / 100;
    return Math.max(0, subtotal - descuentoAmount);
  };

  const calculateDescuentoAmount = () => {
    const subtotal = Number(formData.precio) || calculateSubtotal();
    const descuentoPorcentaje = Number(formData.descuento) || 0;
    return (subtotal * descuentoPorcentaje) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del paquete es requerido",
        variant: "destructive"
      });
      return;
    }

    if (!formData.precio || Number(formData.precio) <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0",
        variant: "destructive"
      });
      return;
    }

    if (products.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un producto al paquete",
        variant: "destructive"
      });
      return;
    }

    // Validar que todos los productos estén seleccionados
    const invalidProducts = products.filter(p => !p.producto || p.cantidad <= 0);
    if (invalidProducts.length > 0) {
      toast({
        title: "Error",
        description: "Todos los productos deben estar seleccionados y tener una cantidad válida",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      if (isEditing && editingPackage) {
        // Actualizar paquete existente
        const updateData: UpdatePackageData = {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || undefined,
          precio: Number(formData.precio),
          descuento: formData.descuento ? Number(formData.descuento) : undefined,
          productos: products.map(p => ({
            fkid_producto: p.fkid_producto,
            cantidad: p.cantidad
          }))
        };

        const response = await packagesService.updatePackage(editingPackage.id, updateData);
        
        if (response.success) {
          toast({
            title: "Paquete actualizado",
            description: `Paquete "${response.data.paquete.nombre}" actualizado exitosamente`,
          });
          
          onPackageCreated();
          onOpenChange(false);
        }
      } else {
        // Crear nuevo paquete
        const packageData: CreatePackageData = {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || undefined,
          precio: Number(formData.precio),
          descuento: formData.descuento ? Number(formData.descuento) : undefined,
          productos: products.map(p => ({
            fkid_producto: p.fkid_producto,
            cantidad: p.cantidad
          }))
        };

        const response = await packagesService.createPackage(packageData);
        
        if (response.success) {
          toast({
            title: "Paquete creado",
            description: `Paquete "${response.data.paquete.nombre}" creado exitosamente`,
          });
          
          onPackageCreated();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error(`Error al ${isEditing ? 'actualizar' : 'crear'} paquete:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Error al ${isEditing ? 'actualizar' : 'crear'} el paquete`,
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Paquete' : 'Crear Nuevo Paquete'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información del paquete y sus productos'
              : 'Crea un nuevo paquete con productos y precios personalizados'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Paquete */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Paquete</CardTitle>
              <CardDescription>
                Datos básicos del paquete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Paquete *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  placeholder="Ej: Paquete Premium 3 Meses"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange("descripcion", e.target.value)}
                  placeholder="Describe el paquete y sus beneficios..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio del Paquete *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="precio"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => handleInputChange("precio", e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descuento">Descuento % (Opcional)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="descuento"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.descuento}
                      onChange={(e) => handleInputChange("descuento", e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Resumen de Precios */}
              {formData.precio && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Precio Base:</span>
                    <span className="font-medium">${Number(formData.precio).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {formData.descuento && Number(formData.descuento) > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Descuento ({Number(formData.descuento)}%):</span>
                        <span className="font-medium text-green-600">-${calculateDescuentoAmount().toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>${calculateTotal().toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Productos del Paquete */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Productos del Paquete</CardTitle>
                  <CardDescription>
                    Agrega los productos que incluye este paquete
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
                  <PackageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">Haz clic en "Agregar Producto" para comenzar</p>
                </div>
              ) : (
                products.map((product, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <Label>Producto *</Label>
                          <ProductSelector
                            value={product.fkid_producto || undefined}
                            onValueChange={(selectedProduct) => handleProductSelect(index, selectedProduct)}
                            placeholder="Seleccionar producto..."
                            disabled={loading}
                          />
                        </div>

                        {product.producto && (
                          <div className="p-3 bg-muted rounded-lg space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{product.producto.nombre}</span>
                              {product.producto.precio_venta && (
                                <Badge variant="secondary">
                                  ${Number(product.producto.precio_venta).toLocaleString('es-CO')}
                                </Badge>
                              )}
                            </div>
                            {product.producto.descripcion && (
                              <p className="text-xs text-muted-foreground">{product.producto.descripcion}</p>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={product.cantidad}
                            onChange={(e) => updateProduct(index, "cantidad", parseInt(e.target.value) || 1)}
                            placeholder="1"
                            disabled={loading}
                          />
                        </div>

                        {product.producto && product.cantidad > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Subtotal: ${(Number(product.producto.precio_venta || 0) * product.cantidad).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProduct(index)}
                        disabled={loading}
                        className="ml-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {/* Resumen de Productos */}
              {products.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total de Productos:</span>
                    <Badge variant="secondary" className="text-lg">
                      {products.reduce((sum, p) => sum + p.cantidad, 0)} unidades
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">Subtotal Estimado:</span>
                    <span className="font-bold">
                      ${calculateSubtotal().toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
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
              {isEditing ? 'Actualizar Paquete' : 'Crear Paquete'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePackageModal;

