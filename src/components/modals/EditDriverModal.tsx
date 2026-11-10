import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, User } from "lucide-react";
import { driversService, Driver, UpdateDriverData } from "@/services/driversService";
import { citiesService } from "@/services/citiesService";
import { useToast } from "@/hooks/use-toast";
import { config } from "@/config/environment";
import { DriverWizard } from "@/components/modals/DriverWizard";

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver: Driver | null;
}

interface City {
  id: number;
  nombre: string;
  departamento: string;
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fotoSrc(name?: string | null) {
  if (!name) return "";
  if (name.startsWith("http://") || name.startsWith("https://")) return name;
  if (name.startsWith("/")) return `${config.imageBaseUrl}${name}`;
  return `${config.imageBaseUrl}/uploads/repartidores/${name}`;
}

const EditDriverModal = ({ isOpen, onClose, onSuccess, driver }: EditDriverModalProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState<UpdateDriverData>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [licenciaFoto, setLicenciaFoto] = useState<File | null>(null);
  const [ineArchivo, setIneArchivo] = useState<File | null>(null);
  const [consentimientoArchivo, setConsentimientoArchivo] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && driver) {
      setStep(1);
      loadCitiesAndSetFormData();
    }
  }, [isOpen, driver]);

  const loadCitiesAndSetFormData = async () => {
    if (!driver) return;
    try {
      setLoadingData(true);
      const response = await citiesService.getAllCities();
      if (response.success) {
        setCities(response.data.cities || []);
        const ciudadId = parseInt(driver.ciudad?.id?.toString() || driver.fkid_ciudad?.toString() || "0");
        setFormData({
          codigo_repartidor: driver.codigo_repartidor || "",
          nombre_completo: driver.nombre_completo || "",
          telefono: driver.telefono || "",
          email: driver.email || "",
          fkid_ciudad: ciudadId,
          tipo_vehiculo: driver.tipo_vehiculo || "moto",
          capacidad_carga: driver.capacidad_carga || 0,
          estado: driver.estado || "disponible",
          zona_cobertura: driver.zona_cobertura,
          horario_trabajo: driver.horario_trabajo,
          tarifa_base: driver.tarifa_base || 0,
          comision_porcentaje: driver.comision_porcentaje || 0,
          fecha_nacimiento: driver.fecha_nacimiento || "",
          direccion: driver.direccion || "",
          licencia_vigencia: driver.licencia_vigencia || "",
          seguro_social: driver.seguro_social || "",
          tipo_sangre: driver.tipo_sangre || "",
          consentimiento_at: toDatetimeLocal(driver.consentimiento_at),
          notas: driver.notas || "",
          es_prueba: Boolean(driver.es_prueba),
        });
        setLicenciaFoto(null);
        setIneArchivo(null);
        setConsentimientoArchivo(null);
        setFieldErrors({});
      }
    } catch (error) {
      console.error("Error al cargar ciudades:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof UpdateDriverData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field as string]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!driver) return;
    try {
      setLoading(true);
      setFieldErrors({});
      const dataToSend = { ...formData };
      if (!dataToSend.contrasena || dataToSend.contrasena.trim() === "") delete dataToSend.contrasena;
      const response = await driversService.updateDriver(driver.id, dataToSend, {
        licencia_foto: licenciaFoto,
        consentimiento_archivo: consentimientoArchivo,
        ine_archivo: ineArchivo,
      });
      if (response.success) {
        toast({ title: "Éxito", description: "Repartidor actualizado correctamente" });
        onSuccess();
        handleClose();
      } else if (response.errors && Array.isArray(response.errors)) {
        const errors: Record<string, string> = {};
        response.errors.forEach((error: any) => {
          if (error.path && error.msg) errors[error.path] = error.msg;
        });
        setFieldErrors(errors);
        toast({ title: "Errores de validación", description: "Por favor corrige los errores en el formulario", variant: "destructive" });
      } else {
        toast({ title: "Error", description: response.message || "No se pudo actualizar el repartidor", variant: "destructive" });
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      if (error.response?.status === 400 && errorData?.errors) {
        const errors: Record<string, string> = {};
        errorData.errors.forEach((err: any) => {
          if (err.path && err.msg) errors[err.path] = err.msg;
        });
        setFieldErrors(errors);
        toast({ title: "Errores de validación", description: Object.values(errors).join(", ") || errorData.message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: errorData?.message || error.message || "No se pudo actualizar el repartidor", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Editar repartidor
          </DialogTitle>
          <DialogDescription>
            Completa la información para dar de alta al repartidor en la flota oficial Miau Miau
          </DialogDescription>
        </DialogHeader>
        {loadingData ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <DriverWizard
            mode="edit"
            step={step}
            onStep={setStep}
            loading={loading}
            formData={formData}
            cities={cities}
            onChange={handleInputChange}
            files={{ licencia: licenciaFoto, ine: ineArchivo, consentimiento: consentimientoArchivo }}
            onFile={(key, file) => {
              if (key === "licencia") setLicenciaFoto(file);
              if (key === "ine") setIneArchivo(file);
              if (key === "consentimiento") setConsentimientoArchivo(file);
            }}
            existing={{
              licencia_foto: driver?.licencia_foto,
              ine_archivo: driver?.ine_archivo,
              consentimiento_archivo: driver?.consentimiento_archivo,
            }}
            fotoSrc={fotoSrc}
            fieldError={(field) => fieldErrors[field]}
            onCancel={handleClose}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditDriverModal;
