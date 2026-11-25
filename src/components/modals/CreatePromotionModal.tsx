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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, DollarSign, Percent, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { promotionsService, Promotion } from "@/services/promotionsService";
import { citiesService, City } from "@/services/citiesService";
import { inventariosService, Inventario } from "@/services/inventariosService";
import { ConfirmCloseDialog, formDirty, useConfirmClose } from "@/components/ConfirmClose";

const STEPS = [
  { id: 1, title: "General y Descuento" },
  { id: 2, title: "Límites y Condiciones" },
  { id: 3, title: "Alcance y Cobertura" },
];

const AUDIENCIA = [
  { id: "todos" as const, label: "Todos" },
  { id: "retail" as const, label: "Cliente general" },
  { id: "distribuidor" as const, label: "Distribuidor" },
];

const TIPOS = [
  { id: "porcentaje", label: "Porcentaje del pedido", hint: "Se resta ese % del subtotal, o solo de los productos que marques. Si pones tope, no pasa de esa cantidad." },
  { id: "monto_fijo", label: "Monto fijo en pesos", hint: "Se restan esos pesos al total, sin importar el tamaño del pedido. Nunca baja de cero." },
  { id: "envio_gratis", label: "Envío gratis", hint: "El cliente no paga envío. El precio de los productos no cambia." },
  { id: "descuento_especial", label: "Porcentaje de campaña", hint: "Igual que el porcentaje: se resta un % del pedido o de los productos. Úsalo para una campaña con nombre propio." },
];

const EMPTY_PROMO = {
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
  productos_ids: [] as number[],
  unidades_minimas: "",
  aplica_a: "todos" as "todos" | "retail" | "distribuidor",
};

function codigoDesdeNombre(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
}

function formFromPromotion(promotion?: Promotion) {
  if (!promotion) return EMPTY_PROMO;
  return {
    nombre: promotion.nombre,
    codigo: promotion.codigo,
    descripcion: promotion.descripcion || "",
    tipo_promocion: promotion.tipo_promocion,
    valor_descuento: String(promotion.valor_descuento ?? ""),
    fecha_inicio: promotion.fecha_inicio ? new Date(promotion.fecha_inicio) : undefined,
    fecha_fin: promotion.fecha_fin ? new Date(promotion.fecha_fin) : undefined,
    limite_uso: promotion.limite_uso != null ? String(promotion.limite_uso) : "",
    compra_minima: promotion.compra_minima != null ? String(promotion.compra_minima) : "",
    descuento_maximo: promotion.descuento_maximo != null ? String(promotion.descuento_maximo) : "",
    ciudades: promotion.ciudades?.map((city) => city.id) || [],
    productos_ids: Array.isArray(promotion.productos_ids) ? promotion.productos_ids : [],
    unidades_minimas: promotion.unidades_minimas != null ? String(promotion.unidades_minimas) : "",
    aplica_a: promotion.aplica_a || "todos",
  };
}

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promotion?: Promotion;
}

const CreatePromotionModal = ({ isOpen, onClose, onSuccess, promotion }: CreatePromotionModalProps) => {
  const { toast } = useToast();
  const editing = Boolean(promotion);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [todoPedido, setTodoPedido] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [formData, setFormData] = useState(EMPTY_PROMO);

  useEffect(() => {
    if (!isOpen) return;
    const next = formFromPromotion(promotion);
    setFormData(next);
    setStep(1);
    setTodoPedido(next.productos_ids.length === 0);
    const loadCities = async () => {
      try {
        const response = await citiesService.getAllCities({ activos: "true" });
        setCities(response.data.cities);
      } catch (error) {
        console.error("Error al cargar ciudades:", error);
      }
    };
    loadCities();
    inventariosService.getActiveInventarios()
      .then((response) => setInventario(response.data.inventarios || []))
      .catch(() => setInventario([]));
  }, [isOpen, promotion]);

  const payload = () => {
    const inicio = new Date(formData.fecha_inicio as Date);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(formData.fecha_fin as Date);
    fin.setHours(23, 59, 59, 999);
    return {
      nombre: formData.nombre,
      codigo: formData.codigo,
      descripcion: formData.descripcion || undefined,
      tipo_promocion: formData.tipo_promocion as Promotion["tipo_promocion"],
      valor_descuento: formData.tipo_promocion === "envio_gratis" ? 0 : parseFloat(formData.valor_descuento),
      fecha_inicio: inicio.toISOString(),
      fecha_fin: fin.toISOString(),
      limite_uso: parseInt(formData.limite_uso, 10) || 0,
      compra_minima: formData.compra_minima ? parseFloat(formData.compra_minima) : undefined,
      descuento_maximo: formData.descuento_maximo ? parseFloat(formData.descuento_maximo) : undefined,
      ciudades: formData.ciudades,
      aplica_a: formData.aplica_a,
      unidades_minimas: formData.unidades_minimas ? parseInt(formData.unidades_minimas, 10) : null,
      productos_ids: todoPedido ? [] : formData.productos_ids,
    };
  };

  const validarPaso1 = () => {
    if (!formData.nombre.trim()) {
      toast({ title: "Nombre", description: "Ponle un nombre para reconocerla en el listado.", variant: "destructive" });
      return false;
    }
    if (!formData.codigo.trim()) {
      toast({ title: "Código", description: "Ese código es el que escribe el cliente para aplicar el descuento.", variant: "destructive" });
      return false;
    }
    if (!formData.tipo_promocion) {
      toast({ title: "Tipo de descuento", description: "Elige si resta un porcentaje, pesos fijos o deja el envío en cero.", variant: "destructive" });
      return false;
    }
    if (formData.tipo_promocion !== "envio_gratis" && !formData.valor_descuento) {
      toast({
        title: formData.tipo_promocion === "monto_fijo" ? "Monto" : "Porcentaje",
        description: formData.tipo_promocion === "monto_fijo" ? "Indica cuántos pesos se descuentan del pedido." : "Indica el porcentaje que se va a descontar.",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast({ title: "Vigencia", description: "La promoción necesita fecha de inicio y de fin.", variant: "destructive" });
      return false;
    }
    const inicio = new Date(formData.fecha_inicio);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(formData.fecha_fin);
    fin.setHours(23, 59, 59, 999);
    if (fin <= inicio) {
      toast({ title: "Vigencia", description: "La fecha de fin tiene que ser posterior a la de inicio.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (validarPaso1()) setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (!todoPedido && formData.productos_ids.length === 0) {
      toast({ title: "Productos", description: "Elige al menos un producto o aplica a todo el pedido.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const data = payload();
      if (promotion) await promotionsService.updatePromotion(promotion.id, data);
      else await promotionsService.createPromotion(data);
      toast({
        title: promotion ? "Promoción actualizada" : "Promoción creada",
        description: promotion ? "Los cambios ya aplican en el checkout." : "Ya se puede usar el código en el pedido.",
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar promoción:", error);
      toast({
        title: "No se guardó",
        description: error instanceof Error ? error.message : "Revisa los datos e inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCityToggle = (cityId: number) => {
    setFormData((prev) => ({
      ...prev,
      ciudades: prev.ciudades.includes(cityId)
        ? prev.ciudades.filter((id) => id !== cityId)
        : [...prev.ciudades, cityId],
    }));
  };

  const gruposProducto = [...inventario.reduce((grupos, item) => {
    const ids = grupos.get(item.nombre) || [];
    ids.push(item.id);
    grupos.set(item.nombre, ids);
    return grupos;
  }, new Map<string, number[]>()).entries()].map(([nombre, ids]) => ({ nombre, ids }));

  const gruposElegidos = gruposProducto.filter((grupo) => grupo.ids.every((id) => formData.productos_ids.includes(id)));

  const toggleProducto = (ids: number[]) => {
    setFormData((prev) => {
      const marcado = ids.every((id) => prev.productos_ids.includes(id));
      return {
        ...prev,
        productos_ids: marcado
          ? prev.productos_ids.filter((id) => !ids.includes(id))
          : [...new Set([...prev.productos_ids, ...ids])],
      };
    });
  };

  const { ask, setAsk, requestClose, confirm, onOpenChange } = useConfirmClose(
    onClose,
    formDirty(formData, formFromPromotion(promotion)),
    loading,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar promoción" : "Nueva Promoción"}</DialogTitle>
          <DialogDescription>
            Crea cupones y reglas de descuento por producto, perfil de cliente y ciudad
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
                onClick={() => {
                  if (item.id < step || (item.id === 2 && validarPaso1()) || (item.id === 3 && validarPaso1())) setStep(item.id);
                }}
                className={cn(
                  "rounded-md px-3 py-2 text-left text-sm font-medium",
                  active ? "bg-primary text-primary-foreground" : done ? "bg-primary/10 text-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {item.title}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre de la promoción"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                      placeholder="CÓDIGO_PROMOCIÓN"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData((prev) => ({ ...prev, codigo: codigoDesdeNombre(prev.nombre) || prev.codigo }))}
                    >
                      Generar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción de la promoción"
                  rows={3}
                />
              </div>

              <div className="space-y-3 rounded-xl bg-primary/5 p-4">
                <p className="text-sm font-semibold text-primary">Cómo se aplica el descuento</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TIPOS.map((tipo) => {
                    const active = formData.tipo_promocion === tipo.id;
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFormData((prev) => ({ ...prev, tipo_promocion: tipo.id }))}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left",
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground",
                        )}
                      >
                        <span className="block text-sm font-semibold">{tipo.label}</span>
                        <span className={cn("mt-1 block text-xs leading-snug", active ? "text-primary-foreground/85" : "text-muted-foreground")}>
                          {tipo.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {formData.tipo_promocion === "envio_gratis" ? (
                  <p className="text-sm text-muted-foreground">Este tipo no pide un valor: el envío queda en cero.</p>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="valor_descuento">
                      {formData.tipo_promocion === "monto_fijo" ? "Monto a descontar *" : "Porcentaje de descuento *"}
                    </Label>
                    <div className="relative">
                      {formData.tipo_promocion === "monto_fijo" ? (
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      )}
                      <Input
                        id="valor_descuento"
                        type="number"
                        value={formData.valor_descuento}
                        onChange={(e) => setFormData((prev) => ({ ...prev, valor_descuento: e.target.value }))}
                        placeholder="0"
                        min="0"
                        max={formData.tipo_promocion === "monto_fijo" ? undefined : 100}
                        step="1"
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}
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
                          !formData.fecha_inicio && "text-muted-foreground",
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
                        onSelect={(date) => setFormData((prev) => ({ ...prev, fecha_inicio: date }))}
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
                          !formData.fecha_fin && "text-muted-foreground",
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
                        onSelect={(date) => setFormData((prev) => ({ ...prev, fecha_fin: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limite_uso">Límite de Uso</Label>
                  <Input
                    id="limite_uso"
                    type="number"
                    value={formData.limite_uso}
                    onChange={(e) => setFormData((prev) => ({ ...prev, limite_uso: e.target.value }))}
                    placeholder="0 = Ilimitado"
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-muted-foreground">0 = usos ilimitados en toda la campaña</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compra_minima">Compra mínima</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="compra_minima"
                      type="number"
                      value={formData.compra_minima}
                      onChange={(e) => setFormData((prev) => ({ ...prev, compra_minima: e.target.value }))}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">0 = sin monto mínimo</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descuento_maximo">Tope del descuento</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="descuento_maximo"
                      type="number"
                      value={formData.descuento_maximo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, descuento_maximo: e.target.value }))}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Tope en pesos cuando el tipo es porcentaje</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidades_minimas">A partir de cuántas unidades</Label>
                  <Input
                    id="unidades_minimas"
                    type="number"
                    value={formData.unidades_minimas}
                    onChange={(e) => setFormData((prev) => ({ ...prev, unidades_minimas: e.target.value }))}
                    placeholder="Vacío = sin mínimo"
                    min="1"
                    step="1"
                  />
                  <p className="text-xs text-muted-foreground">Vacío = sin mínimo de piezas</p>
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
                El cliente obtiene el beneficio si su orden cumple la compra mínima y el límite de piezas al mismo tiempo.
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="space-y-2">
                <Label>Aplica a perfil de cliente *</Label>
                <div role="group" className="grid grid-cols-3 gap-2">
                  {AUDIENCIA.map((item) => {
                    const active = formData.aplica_a === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFormData((prev) => ({ ...prev, aplica_a: item.id }))}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-sm font-semibold",
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label htmlFor="todo-pedido">Productos aplicables</Label>
                    <p className="text-xs text-muted-foreground">Apaga el switch para elegir productos concretos</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="todo-pedido" className="text-sm font-normal">Aplicar a todo el pedido</Label>
                    <Switch
                      id="todo-pedido"
                      checked={todoPedido}
                      onCheckedChange={(checked) => {
                        setTodoPedido(checked);
                        if (checked) setFormData((prev) => ({ ...prev, productos_ids: [] }));
                      }}
                    />
                  </div>
                </div>
                {todoPedido ? (
                  <div className="rounded-xl bg-primary/5 px-4 py-3 text-sm">
                    Sin filtro de productos: la promoción aplica de manera global a todos los productos del catálogo al calcular el total.
                  </div>
                ) : (
                  <>
                    {gruposElegidos.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {gruposElegidos.map((grupo) => (
                          <Badge key={grupo.nombre} variant="secondary" className="gap-1 pr-1">
                            {grupo.nombre}
                            <button
                              type="button"
                              aria-label={`Quitar ${grupo.nombre}`}
                              className="rounded-sm p-0.5 hover:bg-muted"
                              onClick={() => toggleProducto(grupo.ids)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <Card>
                      <CardContent className="p-4">
                        <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
                          {gruposProducto.map((grupo) => (
                            <div key={grupo.nombre} className="flex items-center space-x-2">
                              <Checkbox
                                id={`prod-${grupo.ids[0]}`}
                                checked={grupo.ids.every((id) => formData.productos_ids.includes(id))}
                                onCheckedChange={() => toggleProducto(grupo.ids)}
                              />
                              <Label htmlFor={`prod-${grupo.ids[0]}`} className="cursor-pointer text-sm font-normal">
                                {grupo.nombre}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {gruposProducto.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Sin productos activos.</p>
                        ) : null}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ciudades aplicables</Label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary"
                    onClick={() => setFormData((prev) => ({ ...prev, ciudades: cities.map((city) => city.id) }))}
                  >
                    Seleccionar todas
                  </button>
                </div>
                <Card>
                  <CardContent className="p-4">
                    <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
                      {cities.map((city) => (
                        <div key={city.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`city-${city.id}`}
                            checked={formData.ciudades.includes(city.id)}
                            onCheckedChange={() => handleCityToggle(city.id)}
                          />
                          <Label htmlFor={`city-${city.id}`} className="cursor-pointer text-sm font-normal">
                            {city.nombre}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={requestClose}>
              Cancelar
            </Button>
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>
                Anterior
              </Button>
            ) : null}
            <Button type="submit" disabled={loading}>
              {step < 3 ? "Siguiente" : loading ? "Guardando..." : editing ? "Guardar promoción" : "Crear Promoción"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ConfirmCloseDialog open={ask} onOpenChange={setAsk} onConfirm={confirm} />
    </Dialog>
  );
};

export default CreatePromotionModal;
