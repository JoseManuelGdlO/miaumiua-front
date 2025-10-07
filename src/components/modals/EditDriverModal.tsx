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
import { Loader2, MapPin, Calendar, Car, User, Phone, Mail, FileText, CreditCard, Shield, Activity } from "lucide-react";
import { driversService, Driver, UpdateDriverData } from "@/services/driversService";
import { citiesService } from "@/services/citiesService";
import { useToast } from "@/hooks/use-toast";

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

const EditDriverModal = ({ isOpen, onClose, onSuccess, driver }: EditDriverModalProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState<UpdateDriverData>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && driver) {
      // Cargar ciudades primero, luego setear formData
      loadCitiesAndSetFormData();
    }
  }, [isOpen, driver]);

  const loadCitiesAndSetFormData = async () => {
    if (!driver) return;
    
    try {
      setLoadingData(true);
      
      // Cargar ciudades primero
      const response = await citiesService.getAllCities();
      if (response.success) {
        const citiesData = response.data.cities || [];
        setCities(citiesData);
        
        // Ahora setear formData con la ciudad correcta
        const ciudadId = parseInt(driver.ciudad?.id?.toString() || driver.fkid_ciudad?.toString() || "0");
        
        setFormData({
          codigo_repartidor: driver.codigo_repartidor || "",
          nombre_completo: driver.nombre_completo || "",
          telefono: driver.telefono || "",
          email: driver.email || "",
          fkid_ciudad: ciudadId,
          tipo_vehiculo: driver.tipo_vehiculo || "moto",
          capacidad_carga: driver.capacidad_carga || 0,
          estado: driver.estado || "activo",
          zona_cobertura: driver.zona_cobertura,
          horario_trabajo: driver.horario_trabajo,
          tarifa_base: driver.tarifa_base || 0,
          comision_porcentaje: driver.comision_porcentaje || 0,
          fecha_ingreso: driver.fecha_ingreso || "",
          fecha_nacimiento: driver.fecha_nacimiento || "",
          direccion: driver.direccion || "",
          documento_identidad: driver.documento_identidad || "",
          licencia_conducir: driver.licencia_conducir || "",
          seguro_vehiculo: driver.seguro_vehiculo || "",
          notas: driver.notas || "",
        });
      }
    } catch (error) {
      console.error("Error al cargar ciudades:", error);
    } finally {
      setLoadingData(false);
    }
  };




  const handleInputChange = (field: keyof UpdateDriverData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario lo modifica
    if (fieldErrors[field as string]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!driver) return;

    try {
      setLoading(true);
      setFieldErrors({}); // Limpiar errores previos
      
      const response = await driversService.updateDriver(driver.id, formData);
      
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Repartidor actualizado correctamente",
        });
        onSuccess();
        onClose();
      } else {
        // Manejar errores de validación
        if (response.errors && Array.isArray(response.errors)) {
          const errors: Record<string, string> = {};
          response.errors.forEach((error: any) => {
            if (error.path && error.msg) {
              errors[error.path] = error.msg;
            }
          });
          setFieldErrors(errors);
          
          toast({
            title: "Errores de validación",
            description: "Por favor corrige los errores en el formulario",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "No se pudo actualizar el repartidor",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error al actualizar repartidor:", error);
      
      // Manejar errores de la respuesta
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Verificar si es un error 400 con errores de validación
        if (error.response.status === 400 && errorData.errors && Array.isArray(errorData.errors)) {
          const errors: Record<string, string> = {};
          errorData.errors.forEach((err: any) => {
            if (err.path && err.msg) {
              errors[err.path] = err.msg;
            }
          });
          setFieldErrors(errors);
          
          // Crear mensaje con errores específicos
          const errorMessages = Object.values(errors).join(", ");
          toast({
            title: "Errores de validación",
            description: errorMessages || errorData.message || "Por favor corrige los errores en el formulario",
            variant: "destructive",
          });
        } else {
          // Otros errores
          toast({
            title: "Error",
            description: errorData.message || "No se pudo actualizar el repartidor",
            variant: "destructive",
          });
        }
      } else {
        // Error de red o sin respuesta
        toast({
          title: "Error",
          description: "No se pudo actualizar el repartidor",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !loadingData) {
      setFieldErrors({}); // Limpiar errores al cerrar
      onClose();
    }
  };

  const getFieldError = (fieldName: string) => {
    return fieldErrors[fieldName];
  };

  if (!driver) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Editar Repartidor</span>
          </DialogTitle>
          <DialogDescription>
            Modifica la información del repartidor {driver.nombre_completo}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando datos del repartidor...</span>
            </div>
          </div>
        ) : (

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
                  value={formData.codigo_repartidor || ""}
                  onChange={(e) => handleInputChange("codigo_repartidor", e.target.value)}
                  placeholder="REP-001"
                  required
                  className={getFieldError("codigo_repartidor") ? "border-red-500" : ""}
                />
                {getFieldError("codigo_repartidor") && (
                  <p className="text-sm text-red-500">{getFieldError("codigo_repartidor")}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre Completo</Label>
                <Input
                  id="nombre_completo"
                  value={formData.nombre_completo || ""}
                  onChange={(e) => handleInputChange("nombre_completo", e.target.value)}
                  placeholder="Juan Carlos Pérez"
                  required
                  className={getFieldError("nombre_completo") ? "border-red-500" : ""}
                />
                {getFieldError("nombre_completo") && (
                  <p className="text-sm text-red-500">{getFieldError("nombre_completo")}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono || ""}
                  onChange={(e) => handleInputChange("telefono", e.target.value)}
                  placeholder="555-1234"
                  required
                  className={getFieldError("telefono") ? "border-red-500" : ""}
                />
                {getFieldError("telefono") && (
                  <p className="text-sm text-red-500">{getFieldError("telefono")}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="juan.perez@miaumiau.com"
                  required
                  className={getFieldError("email") ? "border-red-500" : ""}
                />
                {getFieldError("email") && (
                  <p className="text-sm text-red-500">{getFieldError("email")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Estado y Vehículo */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Estado y Vehículo</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado || ""}
                  onValueChange={(value) => handleInputChange("estado", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="ocupado">Ocupado</SelectItem>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="en_ruta">En Ruta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo_vehiculo">Tipo de Vehículo</Label>
                <Select
                  value={formData.tipo_vehiculo || ""}
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
                  value={formData.capacidad_carga || 0}
                  onChange={(e) => handleInputChange("capacidad_carga", parseFloat(e.target.value) || 0)}
                  placeholder="25.0"
                  required
                  className={getFieldError("capacidad_carga") ? "border-red-500" : ""}
                />
                {getFieldError("capacidad_carga") && (
                  <p className="text-sm text-red-500">{getFieldError("capacidad_carga")}</p>
                )}
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
                  value={formData.fkid_ciudad ? formData.fkid_ciudad.toString() : ""}
                  onValueChange={(value) => {
                    console.log("City changed to:", value);
                    handleInputChange("fkid_ciudad", parseInt(value));
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
                  value={formData.direccion || ""}
                  onChange={(e) => handleInputChange("direccion", e.target.value)}
                  placeholder="Calle Principal 123, Col. Centro"
                  required
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tarifa_base">Tarifa Base ($)</Label>
                <Input
                  id="tarifa_base"
                  type="number"
                  step="0.01"
                  value={formData.tarifa_base || 0}
                  onChange={(e) => handleInputChange("tarifa_base", parseFloat(e.target.value) || 0)}
                  placeholder="15.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comision_porcentaje">Comisión (%)</Label>
                <Input
                  id="comision_porcentaje"
                  type="number"
                  step="0.1"
                  value={formData.comision_porcentaje || 0}
                  onChange={(e) => handleInputChange("comision_porcentaje", parseFloat(e.target.value) || 0)}
                  placeholder="10.0"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
                <Input
                  id="fecha_ingreso"
                  type="date"
                  value={formData.fecha_ingreso || ""}
                  onChange={(e) => handleInputChange("fecha_ingreso", e.target.value)}
                  required
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
                value={formData.fecha_nacimiento || ""}
                onChange={(e) => handleInputChange("fecha_nacimiento", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Horarios de Trabajo */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Horarios de Trabajo</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                <div key={dia} className="space-y-2">
                  <Label htmlFor={`horario_${dia}`} className="capitalize">
                    {dia === 'miercoles' ? 'Miércoles' : 
                     dia === 'sabado' ? 'Sábado' : 
                     dia === 'domingo' ? 'Domingo' : 
                     dia.charAt(0).toUpperCase() + dia.slice(1)}
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id={`horario_${dia}_inicio`}
                      type="time"
                      placeholder="Inicio"
                      value={formData.horario_trabajo?.[dia]?.inicio || ""}
                      onChange={(e) => {
                        const newHorario = {
                          ...formData.horario_trabajo,
                          [dia]: {
                            ...(formData.horario_trabajo?.[dia] || {}),
                            inicio: e.target.value
                          }
                        };
                        handleInputChange("horario_trabajo", newHorario);
                      }}
                    />
                    <Input
                      id={`horario_${dia}_fin`}
                      type="time"
                      placeholder="Fin"
                      value={formData.horario_trabajo?.[dia]?.fin || ""}
                      onChange={(e) => {
                        const newHorario = {
                          ...formData.horario_trabajo,
                          [dia]: {
                            ...(formData.horario_trabajo?.[dia] || {}),
                            fin: e.target.value
                          }
                        };
                        handleInputChange("horario_trabajo", newHorario);
                      }}
                    />
                  </div>
                </div>
              ))}
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
                  value={formData.documento_identidad || ""}
                  onChange={(e) => handleInputChange("documento_identidad", e.target.value)}
                  placeholder="12345678"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="licencia_conducir">Licencia de Conducir</Label>
                <Input
                  id="licencia_conducir"
                  value={formData.licencia_conducir || ""}
                  onChange={(e) => handleInputChange("licencia_conducir", e.target.value)}
                  placeholder="LIC-123456"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seguro_vehiculo">Seguro del Vehículo</Label>
                <Input
                  id="seguro_vehiculo"
                  value={formData.seguro_vehiculo || ""}
                  onChange={(e) => handleInputChange("seguro_vehiculo", e.target.value)}
                  placeholder="SEGURO-789"
                  required
                />
              </div>
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
                value={formData.notas || ""}
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
              Actualizar Repartidor
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditDriverModal;
