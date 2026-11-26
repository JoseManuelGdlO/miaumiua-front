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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { citiesService, HORARIO_POR_DIA_DEFAULT, type HorarioPorDia } from "@/services/citiesService";
import { formatHour24To12, parseHour12To24 } from "@/utils/businessHoursTime";
import { Check, ChevronLeft, ChevronRight, Copy, Loader2, MapPin, User } from "lucide-react";
import { ConfirmCloseDialog, formDirty, useConfirmClose } from "@/components/ConfirmClose";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "General y Responsables" },
  { id: 2, title: "Operación y Horarios" },
  { id: 3, title: "Puntos de Venta" },
];

const EMPTY_POINT = { nombre: "", direccion: "", telefono: "", encargado: "" };
const EMPTY_CITY = {
  nombre: "",
  departamento: "",
  direccion_operaciones: "",
  manager: "",
  telefono: "",
  email_contacto: "",
  numero_soporte_cliente: "",
  estado_inicial: "activa" as const,
  max_pedidos_por_horario: 5,
  entregas_por_horario: true,
  prioridad_ruta: 'hora' as 'hora' | 'distancia',
  dias_trabajo: [1, 2, 3, 4, 5] as number[],
  horario_por_dia: { ...HORARIO_POR_DIA_DEFAULT } as HorarioPorDia,
};

interface CreateCityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCityCreated: () => void;
}

const CreateCityModal = ({ open, onOpenChange, onCityCreated }: CreateCityModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingPoints, setSavingPoints] = useState(false);
  const [step, setStep] = useState(1);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_CITY);

  type DraftPointOfSale = {
    nombre: string;
    direccion: string;
    telefono: string;
    encargado: string;
  };

  const [pointsOfSale, setPointsOfSale] = useState<DraftPointOfSale[]>([]);
  const [pointForm, setPointForm] = useState<DraftPointOfSale>(EMPTY_POINT);
  const [editingHorario, setEditingHorario] = useState<string | null>(null);
  const [horarioDraft, setHorarioDraft] = useState("");

  // Reset form cuando se abre el modal
  const resetForm = () => {
    setInviteUrl(null);
    setStep(1);
    setFormData({ ...EMPTY_CITY, horario_por_dia: { ...HORARIO_POR_DIA_DEFAULT } });
    setPointsOfSale([]);
    setPointForm(EMPTY_POINT);
  };

  const handlePointInputChange = (field: keyof DraftPointOfSale, value: string) => {
    setPointForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddPoint = () => {
    if (!pointForm.nombre || !pointForm.direccion) {
      toast({
        title: "Error",
        description: "Nombre y dirección del punto de venta son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setPointsOfSale(prev => [...prev, pointForm]);
    setPointForm(EMPTY_POINT);
  };

  const handleRemovePoint = (index: number) => {
    setPointsOfSale(prev => prev.filter((_, i) => i !== index));
  };

  const mensajePaso1 = () => {
    if (!formData.nombre || !formData.departamento || !formData.manager || !formData.telefono || !formData.email_contacto) {
      return "Por favor completa todos los campos obligatorios";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contacto)) {
      return "El email no tiene un formato válido";
    }
    if (!/^[\+]?[0-9\s\-\(\)]+$/.test(formData.telefono)) {
      return "El teléfono no tiene un formato válido";
    }
    if (formData.numero_soporte_cliente.trim() && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.numero_soporte_cliente)) {
      return "El número de soporte al cliente no tiene un formato válido";
    }
    return null;
  };

  const mensajePaso2 = () => {
    if (formData.max_pedidos_por_horario < 1 || formData.max_pedidos_por_horario > 100) {
      return "El máximo de pedidos por horario debe estar entre 1 y 100";
    }
    if (!formData.dias_trabajo || formData.dias_trabajo.length === 0) {
      return "Debe seleccionar al menos un día de trabajo";
    }
    const diasLabels: Record<string, string> = {
      "0": "Domingo", "1": "Lunes", "2": "Martes", "3": "Miércoles",
      "4": "Jueves", "5": "Viernes", "6": "Sábado",
    };
    for (const key of ["0", "1", "2", "3", "4", "5", "6"]) {
      const slot = formData.horario_por_dia[key];
      if (!slot) continue;
      const { inicio, fin } = slot;
      if (inicio < 0 || inicio > 23 || fin < 0 || fin > 23) {
        return `En ${diasLabels[key]}: hora inicio y fin deben ser válidas (ej. 9 am, 5 pm)`;
      }
      if (inicio >= fin) {
        return `En ${diasLabels[key]}: la hora de inicio debe ser menor que la de fin`;
      }
    }
    return null;
  };

  const canNext = () => (step === 1 ? !mensajePaso1() : step === 2 ? !mensajePaso2() : true);

  const goStep = (id: number) => {
    if (id < step || (id === step + 1 && canNext())) setStep(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const falta = mensajePaso1() || mensajePaso2();
    if (falta) {
      toast({ title: "Error", description: falta, variant: "destructive" });
      if (mensajePaso1()) setStep(1);
      else setStep(2);
      return;
    }

    try {
      setLoading(true);

      const response = await citiesService.createCity({
        ...formData,
        ...(formData.numero_soporte_cliente.trim()
          ? { numero_soporte_cliente: formData.numero_soporte_cliente.trim() }
          : {}),
      });

      if (response.success) {
        const createdCity = response.data?.city;

        if (createdCity && pointsOfSale.length > 0) {
          setSavingPoints(true);
          for (const point of pointsOfSale) {
            try {
              await citiesService.createPointOfSale(createdCity.id, {
                nombre: point.nombre,
                direccion: point.direccion,
                telefono: point.telefono || undefined,
                encargado: point.encargado || undefined,
              });
            } catch (error) {
              console.error("Error al crear punto de venta:", error);
              toast({
                title: "Aviso",
                description: "La ciudad se creó, pero hubo errores creando algunos puntos de venta.",
                variant: "destructive",
              });
            }
          }
        }

        toast({
          title: "Ciudad creada",
          description: `${formData.nombre} ha sido registrada exitosamente`,
        });
        onCityCreated();
        const createdInviteUrl = response.data.whatsapp?.inviteUrl;
        if (createdInviteUrl) {
          setInviteUrl(createdInviteUrl);
        } else {
          resetForm();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error al crear ciudad:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la ciudad",
        variant: "destructive"
      });
    } finally {
      setSavingPoints(false);
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCopyInviteUrl = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({ title: "Link copiado" });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar el link",
        variant: "destructive",
      });
    }
  };

  const handleHorarioChange = (diaKey: string, field: 'inicio' | 'fin', value: number) => {
    setFormData(prev => ({
      ...prev,
      horario_por_dia: {
        ...prev.horario_por_dia,
        [diaKey]: {
          ...prev.horario_por_dia[diaKey],
          [field]: value,
        },
      },
    }));
  };

  const getHorarioFieldKey = (diaKey: string, field: 'inicio' | 'fin') => `${diaKey}-${field}`;

  const handleHorarioFocus = (diaKey: string, field: 'inicio' | 'fin', currentValue: number) => {
    const fieldKey = getHorarioFieldKey(diaKey, field);
    setEditingHorario(fieldKey);
    setHorarioDraft(formatHour24To12(currentValue));
  };

  const handleHorarioBlur = (diaKey: string, field: 'inicio' | 'fin', currentValue: number, dayLabel: string) => {
    const parsed = parseHour12To24(horarioDraft);
    if (parsed === null) {
      toast({
        title: "Error",
        description: `En ${dayLabel}: usa formato de 12 horas (ej. 9 am, 5 pm)`,
        variant: "destructive",
      });
      setHorarioDraft(formatHour24To12(currentValue));
    } else {
      handleHorarioChange(diaKey, field, parsed);
    }
    setEditingHorario(null);
    setHorarioDraft("");
  };

  const getHorarioDisplayValue = (diaKey: string, field: 'inicio' | 'fin', hour24: number) => {
    const fieldKey = getHorarioFieldKey(diaKey, field);
    if (editingHorario === fieldKey) return horarioDraft;
    return formatHour24To12(hour24);
  };

  const handleDiaTrabajoChange = (dia: number, checked: boolean) => {
    setFormData(prev => {
      const diasTrabajo = [...prev.dias_trabajo];
      if (checked) {
        if (!diasTrabajo.includes(dia)) diasTrabajo.push(dia);
      } else {
        const index = diasTrabajo.indexOf(dia);
        if (index > -1) diasTrabajo.splice(index, 1);
      }
      return { ...prev, dias_trabajo: diasTrabajo.sort((a, b) => a - b) };
    });
  };

  const estados = [
    { value: "activa", label: "Activa" },
    { value: "inactiva", label: "Inactiva" },
    { value: "en_construccion", label: "En Construcción" },
    { value: "mantenimiento", label: "Mantenimiento" },
    { value: "suspendida", label: "Suspendida" }
  ];

  const diasSemana = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" }
  ];

  const { ask, setAsk, requestClose, confirm, onOpenChange: guardClose } = useConfirmClose(
    () => {
      resetForm();
      onOpenChange(false);
    },
    formDirty(formData, EMPTY_CITY) || pointsOfSale.length > 0 || formDirty(pointForm, EMPTY_POINT) || Boolean(inviteUrl),
    loading,
  );

  return (
    <Dialog open={open} onOpenChange={guardClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle className="flex flex-wrap items-center gap-2">
                Nueva Ciudad
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Operaciones</span>
              </DialogTitle>
              <DialogDescription>
                Registra una nueva ciudad de operación para Miau Miau
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-md border p-4">
              <Label>Link para vincular WhatsApp</Label>
              <div className="break-all rounded-md bg-muted p-3 text-sm">{inviteUrl}</div>
              <Button type="button" variant="outline" onClick={handleCopyInviteUrl}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
              >
                Listo
              </Button>
            </DialogFooter>
          </div>
        ) : (
        <form
          className="space-y-6"
          onSubmit={(event) => {
            if (step < 3) {
              event.preventDefault();
              if (canNext()) setStep(step + 1);
              return;
            }
            void handleSubmit(event);
          }}
        >
          <div className="grid grid-cols-3 gap-2">
            {STEPS.map((item) => {
              const active = step === item.id;
              const done = step > item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goStep(item.id)}
                  className={`rounded-xl px-3 py-3 text-left ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="block text-xs font-medium">{item.id}</span>
                  <span className="block text-sm font-semibold leading-tight">{item.title}</span>
                </button>
              );
            })}
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Datos de la ciudad</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Ciudad *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    placeholder="Ej: Bogotá"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento *</Label>
                  <Input
                    id="departamento"
                    value={formData.departamento}
                    onChange={(e) => handleInputChange("departamento", e.target.value)}
                    placeholder="Ej: Cundinamarca"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion_operaciones">Dirección de Operaciones</Label>
                <Input
                  id="direccion_operaciones"
                  value={formData.direccion_operaciones}
                  onChange={(e) => handleInputChange("direccion_operaciones", e.target.value)}
                  placeholder="Dirección completa de las operaciones"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado_inicial">Estado Inicial</Label>
                <Select value={formData.estado_inicial} onValueChange={(value) => handleInputChange("estado_inicial", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map((estado) => (
                      <SelectItem key={estado.value} value={estado.value}>
                        <span className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", estado.value === "activa" ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                          {estado.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 rounded-md border p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  Responsables y canales locales
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager *</Label>
                    <Input
                      id="manager"
                      value={formData.manager}
                      onChange={(e) => handleInputChange("manager", e.target.value)}
                      placeholder="Nombre del manager"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_contacto">Email *</Label>
                    <Input
                      id="email_contacto"
                      type="email"
                      value={formData.email_contacto}
                      onChange={(e) => handleInputChange("email_contacto", e.target.value)}
                      placeholder="manager@miaumiau.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
                      placeholder="+57 1 234 5678"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_soporte_cliente">Número de soporte al cliente</Label>
                    <Input
                      id="numero_soporte_cliente"
                      value={formData.numero_soporte_cliente}
                      onChange={(e) => handleInputChange("numero_soporte_cliente", e.target.value)}
                      placeholder="618 1892035"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_pedidos_por_horario">Máximo de Pedidos por Horario *</Label>
                <Input
                  id="max_pedidos_por_horario"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_pedidos_por_horario}
                  onChange={(e) => handleInputChange("max_pedidos_por_horario", parseInt(e.target.value) || 5)}
                  placeholder="5"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Número máximo de pedidos que se pueden programar por horario (mañana o tarde)
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="entregas_por_horario"
                  checked={formData.entregas_por_horario}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, entregas_por_horario: checked === true }))}
                />
                <Label htmlFor="entregas_por_horario" className="cursor-pointer text-sm font-normal">
                  Entregas por horario
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Si está apagado, el bot y el alta no preguntan mañana o tarde.
              </p>
              <div className="space-y-2">
                <Label>Días de Trabajo *</Label>
                <div className="grid grid-cols-2 gap-3 rounded-md border p-4">
                  {diasSemana.map((dia) => (
                    <div key={dia.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dia-${dia.value}`}
                        checked={formData.dias_trabajo.includes(dia.value)}
                        onCheckedChange={(checked) => handleDiaTrabajoChange(dia.value, checked as boolean)}
                      />
                      <Label htmlFor={`dia-${dia.value}`} className="cursor-pointer text-sm font-normal">
                        {dia.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Días en que la ciudad opera y realiza entregas (ej. lunes a viernes = [1,2,3,4,5])
                </p>
              </div>
              <div className="space-y-2">
                <Label>Horario por día</Label>
                <p className="text-sm text-muted-foreground">
                  Usa formato de 12 horas (ej. 9 am, 5 pm). Inicio debe ser menor que fin.
                </p>
                <div className="overflow-hidden rounded-md border">
                  <div className="grid grid-cols-[1fr_110px_110px] gap-2 bg-muted/50 p-3 text-sm font-medium">
                    <span>Día</span>
                    <span>Inicio</span>
                    <span>Fin</span>
                  </div>
                  {diasSemana
                    .filter((dia) => formData.dias_trabajo.includes(dia.value))
                    .map((dia) => {
                      const key = String(dia.value);
                      const slot = formData.horario_por_dia[key] ?? { inicio: 9, fin: 18 };
                      return (
                        <div
                          key={dia.value}
                          className="grid grid-cols-[1fr_110px_110px] items-center gap-2 border-t p-3"
                        >
                          <span className="text-sm">{dia.label}</span>
                          <Input
                            type="text"
                            value={getHorarioDisplayValue(key, "inicio", slot.inicio)}
                            placeholder="9 am"
                            onFocus={() => handleHorarioFocus(key, "inicio", slot.inicio)}
                            onChange={(e) => setHorarioDraft(e.target.value)}
                            onBlur={() => handleHorarioBlur(key, "inicio", slot.inicio, dia.label)}
                            className="h-8"
                          />
                          <Input
                            type="text"
                            value={getHorarioDisplayValue(key, "fin", slot.fin)}
                            placeholder="5 pm"
                            onFocus={() => handleHorarioFocus(key, "fin", slot.fin)}
                            onChange={(e) => setHorarioDraft(e.target.value)}
                            onBlur={() => handleHorarioBlur(key, "fin", slot.fin, dia.label)}
                            className="h-8"
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <div>
                <Label className="font-semibold">Puntos de venta de la ciudad</Label>
                <p className="text-sm text-muted-foreground">
                  Agrega los puntos de venta asociados a esta ciudad (nombre, dirección, teléfono y encargado).
                </p>
              </div>
              {pointsOfSale.length > 0 && (
                <div className="space-y-2">
                  {pointsOfSale.map((point, index) => (
                    <div
                      key={`${point.nombre}-${index}`}
                      className="flex flex-col gap-2 rounded-md border p-2 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="text-sm">
                        <div className="font-medium">{point.nombre}</div>
                        <div className="text-muted-foreground">{point.direccion}</div>
                        <div className="text-muted-foreground">
                          {point.telefono && <span className="mr-2">Tel: {point.telefono}</span>}
                          {point.encargado && <span>Encargado: {point.encargado}</span>}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="self-start text-destructive md:self-auto"
                        onClick={() => handleRemovePoint(index)}
                      >
                        Quitar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pv-nombre">Nombre *</Label>
                  <Input
                    id="pv-nombre"
                    value={pointForm.nombre}
                    onChange={(e) => handlePointInputChange("nombre", e.target.value)}
                    placeholder="Nombre del punto de venta"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pv-telefono">Teléfono</Label>
                  <Input
                    id="pv-telefono"
                    value={pointForm.telefono}
                    onChange={(e) => handlePointInputChange("telefono", e.target.value)}
                    placeholder="+52 55 0000 0000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="pv-direccion">Dirección *</Label>
                  <Input
                    id="pv-direccion"
                    value={pointForm.direccion}
                    onChange={(e) => handlePointInputChange("direccion", e.target.value)}
                    placeholder="Dirección del punto de venta"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="pv-encargado">Encargado</Label>
                  <Input
                    id="pv-encargado"
                    value={pointForm.encargado}
                    onChange={(e) => handlePointInputChange("encargado", e.target.value)}
                    placeholder="Nombre del encargado"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="secondary" onClick={handleAddPoint}>
                  Agregar punto de venta
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              3 secciones configurables
            </p>
            <div className="flex gap-2">
              {step === 1 ? (
                <Button type="button" variant="outline" onClick={requestClose} disabled={loading}>
                  Cancelar
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
                  <ChevronLeft className="h-4 w-4" />
                  Volver
                </Button>
              )}
              {step < 3 ? (
                <Button type="submit" disabled={!canNext() || loading}>
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {(loading || savingPoints) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Crear Ciudad
                </Button>
              )}
            </div>
          </div>
        </form>
        )}
      </DialogContent>
      <ConfirmCloseDialog open={ask} onOpenChange={setAsk} onConfirm={confirm} />
    </Dialog>
  );
};

export default CreateCityModal;