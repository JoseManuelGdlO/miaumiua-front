import { useEffect, useMemo, useState, type ComponentProps } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { inventariosService, Inventario } from "@/services/inventariosService";
import { pesosService } from "@/services/pesosService";
import { categoriasProductoService } from "@/services/categoriasProductoService";
import { citiesService } from "@/services/citiesService";
import { proveedoresService } from "@/services/proveedoresService";
import { config } from "@/config/environment";
import { cn } from "@/lib/utils";
import { ConfirmCloseDialog, formDirty, useConfirmClose } from "@/components/ConfirmClose";
import { Banknote, Package, Warehouse } from "lucide-react";

const STEPS = [
  { id: 1, title: "Datos y logística", Icon: Package },
  { id: 2, title: "Inventario", Icon: Warehouse },
  { id: 3, title: "Precios", Icon: Banknote },
];

const EMPTY = {
  sku: "",
  nombre: "",
  descripcion: "",
  stock_inicial: "",
  stock_minimo: "",
  stock_maximo: "1000",
  precio_venta: "",
  precio_distribuidor: "",
  umbral_mayoreo: "",
  descuento_proveedor_pct: "",
  costo_unitario: "",
  fkid_peso: "",
  fkid_categoria: "",
  fkid_ciudad: "",
  fkid_proveedor: "",
  compra_minima_enabled: false,
  compra_minima: "",
};

function imageUrl(url: string | null | undefined) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${config.imageBaseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

function MoneyInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">$</span>
      <Input className={cn("pl-7", className)} {...props} />
    </div>
  );
}

function listed<T extends { id: number }>(items: T[], current?: T | null) {
  if (!current?.id || items.some((item) => item.id === current.id)) return items;
  return [current, ...items];
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

interface InventarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved?: Inventario) => void;
  inventario?: Inventario | null;
}

const InventarioFormModal = ({ isOpen, onClose, onSuccess, inventario }: InventarioFormModalProps) => {
  const { toast } = useToast();
  const editing = Boolean(inventario);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pesos, setPesos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [formData, setFormData] = useState(EMPTY);
  const [baseline, setBaseline] = useState(EMPTY);
  const [showErrors, setShowErrors] = useState(false);
  const productId = inventario?.id ?? null;

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setShowErrors(false);
    setImageFile(null);
    setImagePreview(inventario?.imagen_url ? imageUrl(inventario.imagen_url) : null);
    void Promise.all([
      pesosService.getAllPesos({ activos: "true" }),
      categoriasProductoService.getAllCategorias({ activos: "true" }),
      citiesService.getAllCities({ activos: "true" }),
      proveedoresService.getAllProveedores({ activos: "true" }),
    ]).then(([pesosRes, categoriasRes, ciudadesRes, proveedoresRes]) => {
      setPesos(pesosRes.data.pesos);
      setCategorias(categoriasRes.data.categorias);
      setCiudades(ciudadesRes.data.cities);
      setProveedores(proveedoresRes.data.proveedores);
    }).catch(() => {
      toast({ title: "Error", description: "No se pudieron cargar los datos de referencia", variant: "destructive" });
    });

    if (!inventario) {
      setFormData(EMPTY);
      setBaseline(EMPTY);
      return;
    }
    const compraMinima = inventario.compra_minima;
    const compraMinimaEnabled = compraMinima != null && compraMinima > 0;
    const next = {
      sku: inventario.sku,
      nombre: inventario.nombre,
      descripcion: inventario.descripcion || "",
      stock_inicial: String(inventario.stock_inicial ?? ""),
      stock_minimo: String(inventario.stock_minimo ?? ""),
      stock_maximo: String(inventario.stock_maximo ?? ""),
      precio_venta: String(inventario.precio_venta ?? ""),
      precio_distribuidor: inventario.precio_distribuidor != null ? String(inventario.precio_distribuidor) : "",
      umbral_mayoreo: inventario.umbral_mayoreo != null ? String(inventario.umbral_mayoreo) : "",
      descuento_proveedor_pct: inventario.descuento_proveedor_pct != null ? String(inventario.descuento_proveedor_pct) : "",
      costo_unitario: String(inventario.costo_unitario ?? ""),
      fkid_peso: String(inventario.fkid_peso || inventario.peso?.id || ""),
      fkid_categoria: String(inventario.fkid_categoria || inventario.categoria?.id || ""),
      fkid_ciudad: String(inventario.fkid_ciudad || inventario.ciudad?.id || ""),
      fkid_proveedor: String(inventario.fkid_proveedor || inventario.proveedor?.id || ""),
      compra_minima_enabled: compraMinimaEnabled,
      compra_minima: compraMinimaEnabled ? String(compraMinima) : "",
    };
    setFormData(next);
    setBaseline(next);
  }, [isOpen, productId]);

  const setField = (key: keyof typeof EMPTY, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  const categoriasLista = listed(categorias, inventario?.categoria);
  const pesosLista = listed(pesos, inventario?.peso);
  const proveedoresLista = listed(proveedores, inventario?.proveedor);
  const ciudadesLista = listed(ciudades, inventario?.ciudad);
  const label = (items: { id: number; nombre?: string }[], id: string, fallback?: string) =>
    items.find((item) => String(item.id) === id)?.nombre || fallback;
  const pesoActual = pesosLista.find((item) => String(item.id) === formData.fkid_peso) || inventario?.peso;

  const margen = useMemo(() => {
    const costo = Number(formData.costo_unitario) || 0;
    const desc = Number(formData.descuento_proveedor_pct) || 0;
    const costoNeto = costo * (1 - Math.min(Math.max(desc, 0), 100) / 100);
    const venta = Number(formData.precio_venta) || 0;
    if (costoNeto <= 0) return null;
    return ((venta - costoNeto) / costoNeto) * 100;
  }, [formData.costo_unitario, formData.descuento_proveedor_pct, formData.precio_venta]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Solo se permiten imágenes (JPG, PNG, GIF, WEBP)", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const payload = () => ({
    sku: formData.sku,
    nombre: formData.nombre,
    descripcion: formData.descripcion || null,
    stock_inicial: parseInt(formData.stock_inicial, 10),
    stock_minimo: parseInt(formData.stock_minimo, 10),
    stock_maximo: parseInt(formData.stock_maximo, 10),
    precio_venta: parseFloat(formData.precio_venta),
    precio_distribuidor: optionalNumber(formData.precio_distribuidor),
    umbral_mayoreo: optionalNumber(formData.umbral_mayoreo),
    descuento_proveedor_pct: optionalNumber(formData.descuento_proveedor_pct),
    costo_unitario: parseFloat(formData.costo_unitario),
    fkid_peso: parseInt(formData.fkid_peso, 10),
    fkid_categoria: parseInt(formData.fkid_categoria, 10),
    fkid_ciudad: parseInt(formData.fkid_ciudad, 10),
    fkid_proveedor: parseInt(formData.fkid_proveedor, 10),
    compra_minima: formData.compra_minima_enabled ? parseInt(formData.compra_minima, 10) : null,
  });

  const missingKeys = (n: number) => {
    const empty = (key: keyof typeof EMPTY) => !String(formData[key] ?? "").trim();
    if (n === 1) return (["sku", "nombre", "fkid_categoria", "fkid_peso", "fkid_proveedor", "fkid_ciudad"] as const).filter(empty);
    if (n === 2) {
      const keys: Array<keyof typeof EMPTY> = ["stock_inicial", "stock_minimo", "stock_maximo"];
      if (formData.compra_minima_enabled) keys.push("compra_minima");
      return keys.filter(empty);
    }
    return (["precio_venta", "costo_unitario"] as const).filter(empty);
  };
  const canStep = (n: number) => missingKeys(n).length === 0;
  const bad = (key: keyof typeof EMPTY) => showErrors && missingKeys(step).includes(key);
  const mark = (key: keyof typeof EMPTY) => cn(bad(key) && "border-destructive focus-visible:ring-destructive");
  const goStep = (next: number) => {
    if (next > step && !canStep(step)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep(next);
  };

  const { ask, setAsk, requestClose, confirm, onOpenChange } = useConfirmClose(
    onClose,
    formDirty(formData, baseline) || Boolean(imageFile),
    loading,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      if (!canStep(step)) {
        setShowErrors(true);
        return;
      }
      goStep(step + 1);
      return;
    }
    if (!canStep(3)) {
      setShowErrors(true);
      return;
    }
    if (formData.compra_minima_enabled) {
      const valor = parseInt(formData.compra_minima, 10);
      if (isNaN(valor) || valor <= 0) {
        toast({ title: "Error", description: "La compra mínima debe ser mayor a 0", variant: "destructive" });
        return;
      }
    }
    try {
      setLoading(true);
      const data = payload();
      let saved: Inventario | undefined;
      if (editing && inventario) {
        if (imageFile) await inventariosService.uploadInventarioImage(inventario.id, imageFile);
        saved = (await inventariosService.updateInventario(inventario.id, data)).data.inventario;
      } else {
        const created = await inventariosService.createInventario(data);
        saved = created.data.inventario;
        if (imageFile) await inventariosService.uploadInventarioImage(saved.id, imageFile);
      }
      toast({ title: "Éxito", description: editing ? "Producto actualizado" : "Producto creado" });
      onSuccess(saved);
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.message || "No se pudo guardar el producto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            Datos generales, inventario de esta ciudad y tarifas para cliente y distribuidor.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((item) => {
            const active = step === item.id;
            const done = step > item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goStep(item.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                  active ? "bg-primary text-primary-foreground" : done ? "bg-primary/10 text-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                <item.Icon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{item.title}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-md bg-muted/50 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Producto" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Foto</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Foto de ficha</Label>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="cursor-pointer hover:border-primary hover:bg-primary/10 file:mr-3 file:rounded-md file:bg-primary/10 file:px-3 file:py-1 file:text-primary hover:file:bg-primary hover:file:text-primary-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input id="sku" value={formData.sku} onChange={(e) => setField("sku", e.target.value.toUpperCase())} required className={mark("sku")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" value={formData.nombre} onChange={(e) => setField("nombre", e.target.value)} required className={mark("nombre")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={formData.fkid_categoria || undefined} onValueChange={(value) => value && setField("fkid_categoria", value)}>
                    <SelectTrigger className={mark("fkid_categoria")}>
                      <SelectValue placeholder="Categoría">{label(categoriasLista, formData.fkid_categoria, inventario?.categoria?.nombre)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasLista.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>{item.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Peso *</Label>
                  <Select value={formData.fkid_peso || undefined} onValueChange={(value) => value && setField("fkid_peso", value)}>
                    <SelectTrigger className={mark("fkid_peso")}>
                      <SelectValue placeholder="Peso">{pesoActual ? `${pesoActual.cantidad} ${pesoActual.unidad_medida}` : undefined}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {pesosLista.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>{item.cantidad} {item.unidad_medida}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <Select value={formData.fkid_proveedor || undefined} onValueChange={(value) => value && setField("fkid_proveedor", value)}>
                    <SelectTrigger className={mark("fkid_proveedor")}>
                      <SelectValue placeholder="Proveedor">{label(proveedoresLista, formData.fkid_proveedor, inventario?.proveedor?.nombre)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {proveedoresLista.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>{item.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ciudad *</Label>
                  <Select value={formData.fkid_ciudad || undefined} onValueChange={(value) => value && setField("fkid_ciudad", value)}>
                    <SelectTrigger className={mark("fkid_ciudad")}>
                      <SelectValue placeholder="Ciudad de este inventario">
                        {label(ciudadesLista, formData.fkid_ciudad, inventario?.ciudad ? `${inventario.ciudad.nombre} — ${inventario.ciudad.departamento}` : undefined)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ciudadesLista.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>{item.nombre} — {item.departamento}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" value={formData.descripcion} onChange={(e) => setField("descripcion", e.target.value)} rows={3} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_inicial">Stock *</Label>
                  <Input id="stock_inicial" type="number" min="0" value={formData.stock_inicial} onChange={(e) => setField("stock_inicial", e.target.value)} required className={mark("stock_inicial")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_minimo">Stock mínimo *</Label>
                  <Input id="stock_minimo" type="number" min="0" value={formData.stock_minimo} onChange={(e) => setField("stock_minimo", e.target.value)} required className={mark("stock_minimo")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_maximo">Stock máximo *</Label>
                  <Input id="stock_maximo" type="number" min="1" value={formData.stock_maximo} onChange={(e) => setField("stock_maximo", e.target.value)} required className={mark("stock_maximo")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descuento_proveedor_pct">Descuento de proveedor en este estado (%)</Label>
                <Input
                  id="descuento_proveedor_pct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.descuento_proveedor_pct}
                  onChange={(e) => setField("descuento_proveedor_pct", e.target.value)}
                  placeholder="Opcional"
                />
                <p className="text-sm text-muted-foreground">Solo afecta el margen estimado. No cambia el precio al cliente.</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="compra_minima_enabled"
                    checked={formData.compra_minima_enabled}
                    onCheckedChange={(checked) => setFormData((prev) => ({
                      ...prev,
                      compra_minima_enabled: !!checked,
                      compra_minima: checked ? prev.compra_minima : "",
                    }))}
                  />
                  <Label htmlFor="compra_minima_enabled" className="cursor-pointer">Compra mínima</Label>
                </div>
                {formData.compra_minima_enabled && (
                  <Input
                    type="number"
                    min={1}
                    value={formData.compra_minima}
                    onChange={(e) => setField("compra_minima", e.target.value)}
                    placeholder="Unidades"
                    className={cn("w-28", mark("compra_minima"))}
                  />
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costo_unitario">Costo unitario *</Label>
                  <MoneyInput id="costo_unitario" type="number" min="0" step="any" value={formData.costo_unitario} onChange={(e) => setField("costo_unitario", e.target.value)} required className={mark("costo_unitario")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio_venta">Precio venta (cliente general) *</Label>
                  <MoneyInput id="precio_venta" type="number" min="0" step="any" value={formData.precio_venta} onChange={(e) => setField("precio_venta", e.target.value)} required className={mark("precio_venta")} />
                </div>
              </div>
              {margen != null && (
                <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                  Margen estimado {margen.toFixed(1)}%
                  {formData.descuento_proveedor_pct ? " con descuento de proveedor" : ""}.
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio_distribuidor">Precio distribuidor / veterinaria</Label>
                  <MoneyInput
                    id="precio_distribuidor"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.precio_distribuidor}
                    onChange={(e) => setField("precio_distribuidor", e.target.value)}
                    placeholder="Si vacío, usa el de venta"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="umbral_mayoreo">Mayoreo a partir de (unidades)</Label>
                  <Input
                    id="umbral_mayoreo"
                    type="number"
                    min="1"
                    value={formData.umbral_mayoreo}
                    onChange={(e) => setField("umbral_mayoreo", e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                El bot de WhatsApp usa el precio de distribuidor si el cliente es veterinaria o distribuidor, o si un cliente general llega al umbral de mayoreo.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={requestClose}>Cancelar</Button>
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>Volver</Button>
            )}
            <Button type="submit" disabled={loading}>
              {step < 3 ? "Siguiente" : loading ? "Guardando..." : editing ? "Actualizar producto" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ConfirmCloseDialog open={ask} onOpenChange={setAsk} onConfirm={confirm} />
    </Dialog>
  );
};

export default InventarioFormModal;
