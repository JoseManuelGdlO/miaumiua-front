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
import { useToast } from "@/hooks/use-toast";
import { inventariosService } from "@/services/inventariosService";
import { pesosService } from "@/services/pesosService";
import { categoriasProductoService } from "@/services/categoriasProductoService";
import { citiesService } from "@/services/citiesService";
import { proveedoresService } from "@/services/proveedoresService";

interface CreateInventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInventarioModal = ({ isOpen, onClose, onSuccess }: CreateInventarioModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pesos, setPesos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    sku: "",
    nombre: "",
    descripcion: "",
    stock_inicial: "",
    stock_minimo: "",
    stock_maximo: "",
    precio_venta: "",
    costo_unitario: "",
    fkid_peso: "",
    fkid_categoria: "",
    fkid_ciudad: "",
    fkid_proveedor: "",
  });

  // Cargar datos de referencia
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [pesosRes, categoriasRes, ciudadesRes, proveedoresRes] = await Promise.all([
          pesosService.getAllPesos({ activos: 'true' }),
          categoriasProductoService.getAllCategorias({ activos: 'true' }),
          citiesService.getAllCities({ activos: 'true' }),
          proveedoresService.getAllProveedores({ activos: 'true' })
        ]);

        setPesos(pesosRes.data.pesos);
        setCategorias(categoriasRes.data.categorias);
        setCiudades(ciudadesRes.data.cities);
        setProveedores(proveedoresRes.data.proveedores);
      } catch (error) {
        console.error('Error al cargar datos de referencia:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de referencia",
          variant: "destructive",
        });
      }
    };

    if (isOpen) {
      loadReferenceData();
    }
  }, [isOpen, toast]);

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        sku: "",
        nombre: "",
        descripcion: "",
        stock_inicial: "",
        stock_minimo: "",
        stock_maximo: "",
        precio_venta: "",
        costo_unitario: "",
        fkid_peso: "",
        fkid_categoria: "",
        fkid_ciudad: "",
        fkid_proveedor: "",
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const createData = {
        sku: formData.sku,
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        stock_inicial: parseInt(formData.stock_inicial),
        stock_minimo: parseInt(formData.stock_minimo),
        stock_maximo: parseInt(formData.stock_maximo),
        precio_venta: parseFloat(formData.precio_venta),
        costo_unitario: parseFloat(formData.costo_unitario),
        fkid_peso: parseInt(formData.fkid_peso),
        fkid_categoria: parseInt(formData.fkid_categoria),
        fkid_ciudad: parseInt(formData.fkid_ciudad),
        fkid_proveedor: parseInt(formData.fkid_proveedor),
      };

      await inventariosService.createInventario(createData);
      
      toast({
        title: "Éxito",
        description: "Inventario creado correctamente",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al crear inventario:', error);
      const errorMessage = error?.response?.data?.error || error?.message || "No se pudo crear el inventario";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
          <DialogDescription>
            Agrega un nuevo producto al inventario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                placeholder="SKU del producto"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre del producto"
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
              placeholder="Descripción del producto"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_inicial">Stock Inicial *</Label>
              <Input
                id="stock_inicial"
                type="number"
                value={formData.stock_inicial}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_inicial: e.target.value }))}
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
              <Input
                id="stock_minimo"
                type="number"
                value={formData.stock_minimo}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_minimo: e.target.value }))}
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_maximo">Stock Máximo *</Label>
              <Input
                id="stock_maximo"
                type="number"
                value={formData.stock_maximo}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_maximo: e.target.value }))}
                placeholder="1000"
                min="1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio_venta">Precio de Venta *</Label>
              <Input
                id="precio_venta"
                type="number"
                value={formData.precio_venta}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_venta: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costo_unitario">Costo Unitario *</Label>
              <Input
                id="costo_unitario"
                type="number"
                value={formData.costo_unitario}
                onChange={(e) => setFormData(prev => ({ ...prev, costo_unitario: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fkid_peso">Peso *</Label>
              <Select
                value={formData.fkid_peso}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fkid_peso: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el peso" />
                </SelectTrigger>
                <SelectContent>
                  {pesos.map((peso) => (
                    <SelectItem key={peso.id} value={peso.id.toString()}>
                      {peso.cantidad} {peso.unidad_medida}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fkid_categoria">Categoría *</Label>
              <Select
                value={formData.fkid_categoria}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fkid_categoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fkid_ciudad">Ciudad *</Label>
              <Select
                value={formData.fkid_ciudad}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fkid_ciudad: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {ciudades.map((ciudad) => (
                    <SelectItem key={ciudad.id} value={ciudad.id.toString()}>
                      {ciudad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fkid_proveedor">Proveedor *</Label>
              <Select
                value={formData.fkid_proveedor}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fkid_proveedor: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((proveedor) => (
                    <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                      {proveedor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInventarioModal;
