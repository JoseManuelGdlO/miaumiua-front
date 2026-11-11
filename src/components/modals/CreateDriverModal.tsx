import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { driversService, CreateDriverData } from "@/services/driversService";
import { citiesService } from "@/services/citiesService";
import { useToast } from "@/hooks/use-toast";
import { DriverWizard } from "@/components/modals/DriverWizard";

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface City {
  id: number;
  nombre: string;
  departamento: string;
}

const CLAVES: Record<string, string> = {
  durango: "DGO",
  jalisco: "JAL",
  "nuevo leon": "NL",
  "ciudad de mexico": "CDMX",
  cdmx: "CDMX",
  coahuila: "COA",
  "estado de mexico": "MEX",
  mexico: "MEX",
  guanajuato: "GTO",
  puebla: "PUE",
  veracruz: "VER",
  yucatan: "YUC",
  sinaloa: "SIN",
  sonora: "SON",
  chihuahua: "CHH",
  tamaulipas: "TAM",
  michoacan: "MIC",
  oaxaca: "OAX",
  "baja california": "BC",
  "baja california sur": "BCS",
  queretaro: "QRO",
  "san luis potosi": "SLP",
  hidalgo: "HGO",
  morelos: "MOR",
  tabasco: "TAB",
  chiapas: "CHP",
  campeche: "CAM",
  nayarit: "NAY",
  colima: "COL",
  tlaxcala: "TLA",
  zacatecas: "ZAC",
  aguascalientes: "AGS",
  guerrero: "GRO",
  "quintana roo": "ROO",
};

function normalizarEstado(texto?: string) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tagDe(texto?: string) {
  const key = normalizarEstado(texto);
  if (!key) return "";
  if (CLAVES[key]) return CLAVES[key];
  const letters = key.replace(/ /g, "").slice(0, 3).toUpperCase();
  return letters.length >= 2 ? letters : "";
}

function codigoDeCiudad(nombre?: string, departamento?: string) {
  const nom = normalizarEstado(nombre);
  const dep = normalizarEstado(departamento);
  const estadoNombre = CLAVES[nom] || "";
  const estadoDep = CLAVES[dep] || "";
  const estado = estadoNombre || estadoDep || tagDe(nombre) || tagDe(departamento) || "MX";
  let sitio = "";
  if (estadoNombre && dep && dep !== nom && !estadoDep) sitio = tagDe(departamento);
  else if (estadoDep && nom && nom !== dep && !estadoNombre) sitio = tagDe(nombre);
  else if (!estadoNombre && !estadoDep && dep && dep !== nom) sitio = tagDe(departamento);
  if (sitio === estado) sitio = "";
  const bytes = new Uint8Array(sitio ? 2 : 3);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return (sitio ? `REP-${estado}-${sitio}-${hex}` : `REP-${estado}-${hex}`).slice(0, 20);
}

const emptyForm = (): CreateDriverData => ({
  codigo_repartidor: "",
  nombre_completo: "",
  telefono: "",
  email: "",
  fkid_ciudad: 0,
  tipo_vehiculo: "moto",
  capacidad_carga: 0,
  tarifa_base: 0,
  comision_porcentaje: 0,
  fecha_nacimiento: "",
  direccion: "",
  licencia_vigencia: "",
  seguro_social: "",
  tipo_sangre: "",
  consentimiento_at: "",
  notas: "",
  contrasena: "",
  es_prueba: false,
});

const CreateDriverModal = ({ isOpen, onClose, onSuccess }: CreateDriverModalProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState<CreateDriverData>(emptyForm);
  const [licenciaFoto, setLicenciaFoto] = useState<File | null>(null);
  const [ineArchivo, setIneArchivo] = useState<File | null>(null);
  const [consentimientoArchivo, setConsentimientoArchivo] = useState<File | null>(null);
  const [polizaArchivo, setPolizaArchivo] = useState<File | null>(null);
  const [descartar, setDescartar] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    loadCities();
    generateDriverCode();
    setStep(1);
  }, [isOpen]);

  const loadCities = async () => {
    try {
      const response = await citiesService.getAllCities();
      if (response.success) setCities(response.data.cities || []);
    } catch (error) {
      console.error("Error al cargar ciudades:", error);
    }
  };

  const generateDriverCode = (city?: City) => {
    setFormData((prev) => ({
      ...prev,
      codigo_repartidor: codigoDeCiudad(city?.nombre, city?.departamento),
    }));
  };

  const handleInputChange = (field: keyof CreateDriverData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setLicenciaFoto(null);
    setIneArchivo(null);
    setConsentimientoArchivo(null);
    setPolizaArchivo(null);
    setStep(1);
  };

  const dirty = () =>
    step > 1
    || Boolean(licenciaFoto || ineArchivo || consentimientoArchivo || polizaArchivo)
    || Boolean(formData.nombre_completo?.trim())
    || Boolean(formData.telefono?.trim())
    || Boolean(formData.email?.trim())
    || Boolean(formData.direccion?.trim())
    || Boolean(formData.contrasena?.trim())
    || Boolean(formData.licencia_vigencia)
    || Boolean(formData.seguro_social)
    || Boolean(formData.tipo_sangre)
    || Boolean(formData.notas?.trim())
    || Boolean(formData.es_prueba)
    || Boolean(formData.fkid_ciudad);

  const cerrarYa = () => {
    if (loading) return;
    setDescartar(false);
    onClose();
    resetForm();
  };

  const pedirCerrar = () => {
    if (loading) return;
    if (dirty()) setDescartar(true);
    else cerrarYa();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await driversService.createDriver(formData, {
        licencia_foto: licenciaFoto,
        consentimiento_archivo: consentimientoArchivo,
        ine_archivo: ineArchivo,
        poliza_seguro_archivo: polizaArchivo,
      });
      if (response.success) {
        toast({ title: "Éxito", description: "Repartidor creado correctamente" });
        onSuccess();
        cerrarYa();
      } else {
        toast({ title: "Error", description: response.message || "No se pudo crear el repartidor", variant: "destructive" });
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessages = errorData?.errors?.map((err: any) => err.msg || err.message).filter(Boolean).join(", ");
      toast({
        title: "Error",
        description: errorMessages || errorData?.message || error.message || "No se pudo crear el repartidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) pedirCerrar(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Nuevo repartidor
          </DialogTitle>
          <DialogDescription>
            Completa la información para dar de alta al repartidor en la flota oficial Miau Miau
          </DialogDescription>
        </DialogHeader>
        <DriverWizard
          mode="create"
          step={step}
          onStep={setStep}
          loading={loading}
          formData={formData}
          cities={cities}
          onChange={handleInputChange}
          onCity={(_id, city) => generateDriverCode(city)}
          files={{ licencia: licenciaFoto, ine: ineArchivo, consentimiento: consentimientoArchivo, poliza: polizaArchivo }}
          onFile={(key, file) => {
            if (key === "licencia") setLicenciaFoto(file);
            if (key === "ine") setIneArchivo(file);
            if (key === "consentimiento") setConsentimientoArchivo(file);
            if (key === "poliza") setPolizaArchivo(file);
          }}
          onCancel={pedirCerrar}
          onSubmit={handleSubmit}
        />
      </DialogContent>
      <AlertDialog open={descartar} onOpenChange={setDescartar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar lo que ya llenaste?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={cerrarYa}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default CreateDriverModal;
