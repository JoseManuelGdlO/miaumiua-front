import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDrop } from "@/components/FileDrop";
import { Bike, ChevronLeft, ChevronRight, Eye, EyeOff, FileText, Loader2, User } from "lucide-react";
import { useState } from "react";

export const TIPOS_SANGRE = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;

export const ESTADOS_ADMIN = [
  { value: "disponible", label: "Disponible" },
  { value: "no_disponible", label: "No disponible" },
  { value: "permiso_economico", label: "Permiso económico" },
  { value: "incapacitado", label: "Incapacitado" },
  { value: "baja", label: "Dado de baja" },
] as const;

export const ESTADOS_LABEL: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  ocupado: "Ocupado",
  disponible: "Disponible",
  en_ruta: "En ruta",
  no_disponible: "No disponible",
  permiso_economico: "Permiso económico",
  incapacitado: "Incapacitado",
  baja: "Dado de baja",
};

export type DriverFormFields = {
  codigo_repartidor?: string;
  nombre_completo?: string;
  telefono?: string;
  email?: string;
  fkid_ciudad?: number;
  tipo_vehiculo?: string;
  capacidad_carga?: number;
  estado?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  licencia_vigencia?: string;
  seguro_social?: string;
  tipo_sangre?: string;
  consentimiento_at?: string;
  notas?: string;
  contrasena?: string;
  es_prueba?: boolean;
};

type City = { id: number; nombre: string; departamento: string };

const STEPS = [
  { id: 1, title: "Perfil y Vehículo" },
  { id: 2, title: "Documentos y siniestro" },
  { id: 3, title: "Configuración y notas" },
];

type Props = {
  mode: "create" | "edit";
  step: number;
  onStep: (step: number) => void;
  loading?: boolean;
  formData: DriverFormFields;
  cities: City[];
  onChange: (field: keyof DriverFormFields, value: string | number | boolean) => void;
  onCity?: (id: number, city?: City) => void;
  files: {
    licencia: File | null;
    ine: File | null;
    consentimiento: File | null;
  };
  onFile: (key: "licencia" | "ine" | "consentimiento", file: File | null) => void;
  existing?: {
    licencia_foto?: string | null;
    ine_archivo?: string | null;
    consentimiento_archivo?: string | null;
  };
  fotoSrc?: (name?: string | null) => string;
  fieldError?: (field: string) => string | undefined;
  onCancel: () => void;
  onSubmit: () => void;
};

export function nowLocal() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function DriverWizard({
  mode,
  step,
  onStep,
  loading,
  formData,
  cities,
  onChange,
  onCity,
  files,
  onFile,
  existing,
  fotoSrc,
  fieldError,
  onCancel,
  onSubmit,
}: Props) {
  const [verContrasena, setVerContrasena] = useState(false);
  const err = (field: string) => fieldError?.(field);

  function canNext() {
    if (step !== 1) return true;
    return Boolean(
      formData.nombre_completo &&
      formData.telefono &&
      formData.email &&
      formData.fkid_ciudad &&
      (mode === "edit" || (formData.contrasena && formData.contrasena.length >= 6))
    );
  }

  return (
    <form
      className="space-y-6"
      autoComplete="off"
      onSubmit={(event) => {
        event.preventDefault();
        if (step < 3) {
          if (canNext()) onStep(step + 1);
          return;
        }
        onSubmit();
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
              onClick={() => {
                if (item.id < step || (item.id === step + 1 && canNext())) onStep(item.id);
              }}
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
        <div className="space-y-6">
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4 text-primary" />
              Información básica del repartidor
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="codigo_repartidor">Código de identificación</Label>
                <Input id="codigo_repartidor" value={formData.codigo_repartidor || ""} readOnly />
                <p className="text-xs text-muted-foreground">Código único determinado por estado y sede asignada.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre completo *</Label>
                <Input
                  id="nombre_completo"
                  value={formData.nombre_completo || ""}
                  onChange={(e) => onChange("nombre_completo", e.target.value)}
                  placeholder="Ej. Juan Carlos Pérez Morales"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono móvil (WhatsApp) *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono || ""}
                  onChange={(e) => onChange("telefono", e.target.value)}
                  placeholder="55 1234 5678"
                  required
                />
                <p className="text-xs text-muted-foreground">Usado para notificaciones y soporte operativo.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver_email">Correo electrónico *</Label>
                <Input
                  id="driver_email"
                  name="driver_email"
                  type="email"
                  autoComplete="off"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
                  value={formData.email || ""}
                  onChange={(e) => onChange("email", e.target.value)}
                  placeholder="repartidor@miaumiau.com"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="driver_mobile_password">{mode === "create" ? "Contraseña de acceso móvil *" : "Nueva contraseña"}</Label>
                <div className="relative">
                  <Input
                    id="driver_mobile_password"
                    name="driver_mobile_password"
                    type={verContrasena ? "text" : "password"}
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
                    value={formData.contrasena || ""}
                    onChange={(e) => onChange("contrasena", e.target.value)}
                    placeholder={mode === "create" ? "Mínimo 6 caracteres" : "Dejar vacío para no cambiar"}
                    minLength={mode === "create" ? 6 : undefined}
                    required={mode === "create"}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                    onClick={() => setVerContrasena((v) => !v)}
                    aria-label={verContrasena ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {verContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Credencial provisional que utilizará en la app de choferes Android / iOS.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Bike className="h-4 w-4 text-primary" />
              Vehículo y cobertura operativa
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de vehículo</Label>
                <Select value={formData.tipo_vehiculo || "moto"} onValueChange={(value) => onChange("tipo_vehiculo", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moto">Motocicleta / Reparto ligero</SelectItem>
                    <SelectItem value="bicicleta">Bicicleta</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="camioneta">Camioneta</SelectItem>
                    <SelectItem value="caminando">Caminando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidad_carga">Capacidad de carga</Label>
                <div className="relative">
                  <Input
                    id="capacidad_carga"
                    type="number"
                    step={10}
                    min={0}
                    value={formData.capacidad_carga || 0}
                    onChange={(e) => onChange("capacidad_carga", parseFloat(e.target.value) || 0)}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">KG</span>
                </div>
                <p className="text-xs text-muted-foreground">Límite volumétrico seguro para asignación de bultos.</p>
              </div>
              <div className="space-y-2">
                <Label>Ciudad base *</Label>
                <Select
                  value={formData.fkid_ciudad ? String(formData.fkid_ciudad) : ""}
                  onValueChange={(value) => {
                    const id = parseInt(value, 10);
                    onChange("fkid_ciudad", id);
                    onCity?.(id, cities.find((city) => city.id === id));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.nombre} ({city.departamento})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección domiciliaria / base</Label>
                <Input
                  id="direccion"
                  value={formData.direccion || ""}
                  onChange={(e) => onChange("direccion", e.target.value)}
                  placeholder="Calle Principal 123, Col. Centro"
                />
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Datos médicos y de siniestro
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento || ""}
                  onChange={(e) => onChange("fecha_nacimiento", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licencia_vigencia">Vigencia de la licencia</Label>
                <Input
                  id="licencia_vigencia"
                  type="date"
                  value={formData.licencia_vigencia || ""}
                  onChange={(e) => onChange("licencia_vigencia", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de sangre</Label>
                <Select
                  value={formData.tipo_sangre || undefined}
                  onValueChange={(value) => onChange("tipo_sangre", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de sangre" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SANGRE.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seguro_social">Seguro social (NSS)</Label>
                <Input
                  id="seguro_social"
                  value={formData.seguro_social || ""}
                  onChange={(e) => onChange("seguro_social", e.target.value)}
                  placeholder="NSS de 11 dígitos"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="consentimiento_at">Cuándo compartió la información</Label>
                <Input
                  id="consentimiento_at"
                  type="datetime-local"
                  value={formData.consentimiento_at || ""}
                  onChange={(e) => onChange("consentimiento_at", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                Documentación oficial
              </h3>
              <p className="text-xs text-muted-foreground">PDF, JPG o PNG, máximo 5 MB</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <FileDrop
                id="licencia_foto"
                label="Foto de la licencia"
                hint="Formato PNG, JPG o PDF hasta 5 MB"
                file={files.licencia}
                existingName={existing?.licencia_foto}
                existingUrl={fotoSrc?.(existing?.licencia_foto)}
                onFile={(file) => onFile("licencia", file)}
              />
              <FileDrop
                id="ine_archivo"
                label="INE / IFE oficial"
                hint="Ambos lados visibles en un archivo"
                required
                file={files.ine}
                existingName={existing?.ine_archivo}
                existingUrl={fotoSrc?.(existing?.ine_archivo)}
                onFile={(file) => onFile("ine", file)}
              />
              <FileDrop
                id="consentimiento_archivo"
                label="Comprobante de entrega de datos"
                hint="Aquí se adjunta evidencia de que el repartidor dio su consentimiento para la recopilación y uso de sus datos con este fin."
                file={files.consentimiento}
                existingName={existing?.consentimiento_archivo}
                existingUrl={fotoSrc?.(existing?.consentimiento_archivo)}
                onFile={(file) => {
                  onFile("consentimiento", file);
                  if (file && !formData.consentimiento_at) onChange("consentimiento_at", nowLocal());
                }}
              />
            </div>
          </section>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Reglas operativas y estado del repartidor</h3>
          {mode === "edit" ? (
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.estado || "disponible"} onValueChange={(value) => onChange("estado", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.estado && !ESTADOS_ADMIN.some((item) => item.value === formData.estado) ? (
                    <SelectItem value={formData.estado}>{ESTADOS_LABEL[formData.estado] || formData.estado}</SelectItem>
                  ) : null}
                  {ESTADOS_ADMIN.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <label className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
            <Checkbox
              id="es_prueba"
              checked={Boolean(formData.es_prueba)}
              onCheckedChange={(checked) => onChange("es_prueba", checked === true)}
            />
            <span>
              <span className="block text-sm font-medium">Repartidor de prueba</span>
              <span className="block text-xs text-muted-foreground">
                Al marcar esta opción, el repartidor no recibirá pedidos automáticos del bot ni entrará en el armado de rutas logísticas. Estará visible exclusivamente en Call Center para pruebas de telemetría y soporte interno.
              </span>
            </span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notas">Notas adicionales y observaciones de flota</Label>
              <span className="text-xs text-muted-foreground">{(formData.notas || "").length} / 500</span>
            </div>
            <Textarea
              id="notas"
              maxLength={500}
              value={formData.notas || ""}
              onChange={(e) => onChange("notas", e.target.value)}
              placeholder="Escribe cualquier detalle relevante sobre el chofer, disponibilidad horaria especial, condiciones de la unidad o acuerdos de contratación…"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Estas notas solo son visibles para operadores, jefes de patio y personal de auditoría de Miau Miau.</p>
          </div>
          {err("contrasena") ? <p className="text-sm text-red-500">{err("contrasena")}</p> : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          {step} de 3 · {step === 1 ? "Información requerida" : step === 2 ? "Documentación" : "Finalizar alta"}
        </p>
        <div className="flex gap-2">
          {step === 1 ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => onStep(step - 1)} disabled={loading}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver
            </Button>
          )}
          {step < 3 ? (
            <Button type="submit" disabled={!canNext() || loading}>
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "create" ? "Crear repartidor" : "Guardar cambios"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
