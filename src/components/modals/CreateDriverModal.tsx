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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin, Calendar, Car, User, Phone, Mail, FileText, CreditCard, Shield, Lock } from "lucide-react";
import { driversService, CreateDriverData } from "@/services/driversService";
import { citiesService } from "@/services/citiesService";
import { useToast } from "@/hooks/use-toast";

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

const CreateDriverModal = ({ isOpen, onClose, onSuccess }: CreateDriverModalProps) => {
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState<CreateDriverData>({
    codigo_repartidor: "",
    nombre_completo: "",
    telefono: "",
    email: "",
    fkid_ciudad: 0,
    tipo_vehiculo: "moto",
    capacidad_carga: 0,
    tarifa_base: 0,
    comision_porcentaje: 0,
    fecha_ingreso: "",
    fecha_nacimiento: "",
    direccion: "",
    documento_identidad: "",
    licencia_conducir: "",
    seguro_vehiculo: "",
    notas: "",
    contrasena: "",
    es_prueba: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadCities();
      // Generar código automático
      generateDriverCode();
    }
  }, [isOpen]);

  const loadCities = async () => {
    try {
      const response = await citiesService.getAllCities();
      if (response.success) {
        setCities(response.data.cities || []);
      }
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await driversService.createDriver(formData);
      
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Repartidor creado correctamente",
        });
        onSuccess();
        onClose();
        resetForm();
      } else {
        // Si la respuesta no es exitosa pero no lanzó error
        const errorMessage = response.message || "No se pudo crear el repartidor";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error al crear repartidor:", error);
      
      // Manejar errores de la respuesta del backend
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Verificar si es un error 400 con errores de validación
        if (error.response.status === 400 && errorData.errors && Array.isArray(errorData.errors)) {
          // Crear mensaje con errores específicos
          const errorMessages = errorData.errors
            .map((err: any) => err.msg || err.message)
            .filter(Boolean)
            .join(", ");
          
          toast({
            title: "Errores de validación",
            description: errorMessages || errorData.message || "Por favor corrige los errores en el formulario",
            variant: "destructive",
          });
        } else {
          // Otros errores (500, 404, etc.)
          const errorMessage = errorData.message || errorData.error || error.message || "No se pudo crear el repartidor";
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        // Error de red o sin respuesta estructurada
        const errorMessage = error.message || "No se pudo crear el repartidor. Verifica tu conexión e intenta nuevamente.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo_repartidor: "",
      nombre_completo: "",
      telefono: "",
      email: "",
      fkid_ciudad: 0,
      tipo_vehiculo: "moto",
      capacidad_carga: 0,
      tarifa_base: 0,
      comision_porcentaje: 0,
      fecha_ingreso: "",
      fecha_nacimiento: "",
      direccion: "",
      documento_identidad: "",
      licencia_conducir: "",
      seguro_vehiculo: "",
      notas: "",
      contrasena: "",
      es_prueba: false,
    });
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Nuevo Repartidor</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información para crear un nuevo repartidor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Información Básica</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo_repartidor">Código del Repartidor</Label>
                <Input
                  id="codigo_repartidor"
                  value={formData.codigo_repartidor}
                  readOnly
                  placeholder="REP-DGO-a1b2c3"
                  maxLength={20}
                  required
                />
                <p className="text-xs text-muted-foreground">Se genera solo. Estado más ubicación si no es la principal.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre Completo</Label>
                <Input
                  id="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={(e) => handleInputChange("nombre_completo", e.target.value)}
                  placeholder="Juan Carlos Pérez"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange("telefono", e.target.value)}
                  placeholder="555-1234"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="juan.perez@miaumiau.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contrasena">Contraseña</Label>
                <Input
                  id="contrasena"
                  type="password"
                  value={formData.contrasena || ""}
                  onChange={(e) => handleInputChange("contrasena", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Contraseña para que el repartidor pueda acceder desde su teléfono
                </p>
              </div>
            </div>
          </div>

          {/* Información del Vehículo */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Car className="h-4 w-4" />
              <span>Información del Vehículo</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_vehiculo">Tipo de Vehículo</Label>
                <Select
                  value={formData.tipo_vehiculo}
                  onValueChange={(value) => handleInputChange("tipo_vehiculo", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moto">🏍️ Moto</SelectItem>
                    <SelectItem value="bicicleta">🚲 Bicicleta</SelectItem>
                    <SelectItem value="auto">🚗 Auto</SelectItem>
                    <SelectItem value="camioneta">🚐 Camioneta</SelectItem>
                    <SelectItem value="caminando">🚶 Caminando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacidad_carga">Capacidad de Carga (kg)</Label>
                <Input
                  id="capacidad_carga"
                  type="number"
                  step="0.1"
                  value={formData.capacidad_carga}
                  onChange={(e) => handleInputChange("capacidad_carga", parseFloat(e.target.value) || 0)}
                  placeholder="25.0"
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Ubicación</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fkid_ciudad">Ciudad</Label>
                <Select
                  value={formData.fkid_ciudad.toString()}
                  onValueChange={(value) => {
                    const id = parseInt(value, 10);
                    const city = cities.find((row) => row.id === id);
                    handleInputChange("fkid_ciudad", id);
                    generateDriverCode(city);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.nombre}, {city.departamento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange("direccion", e.target.value)}
                  placeholder="Calle Principal 123, Col. Centro"
                />
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Información Laboral</span>
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
                <Input
                  id="fecha_ingreso"
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={(e) => handleInputChange("fecha_ingreso", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Información Personal</span>
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => handleInputChange("fecha_nacimiento", e.target.value)}
              />
            </div>
          </div>

          {/* Documentos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Documentos</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documento_identidad">Documento de Identidad</Label>
                <Input
                  id="documento_identidad"
                  value={formData.documento_identidad}
                  onChange={(e) => handleInputChange("documento_identidad", e.target.value)}
                  placeholder="12345678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="licencia_conducir">Licencia de Conducir</Label>
                <Input
                  id="licencia_conducir"
                  value={formData.licencia_conducir}
                  onChange={(e) => handleInputChange("licencia_conducir", e.target.value)}
                  placeholder="LIC-123456"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seguro_vehiculo">Seguro del Vehículo</Label>
                <Input
                  id="seguro_vehiculo"
                  value={formData.seguro_vehiculo}
                  onChange={(e) => handleInputChange("seguro_vehiculo", e.target.value)}
                  placeholder="SEGURO-789"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2 rounded-lg border p-3">
            <Checkbox
              id="es_prueba"
              checked={Boolean(formData.es_prueba)}
              onCheckedChange={(checked) => handleInputChange("es_prueba", checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="es_prueba">Repartidor de prueba</Label>
              <p className="text-xs text-muted-foreground">No entra en el bot ni en el armado de rutas. Sí se ve en Call Center.</p>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Notas Adicionales</span>
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => handleInputChange("notas", e.target.value)}
                placeholder="Información adicional sobre el repartidor..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Repartidor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDriverModal;
