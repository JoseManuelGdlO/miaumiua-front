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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { clientesService, CreateClienteData } from "@/services/clientesService";
import { petsService, CreatePetData } from "@/services/petsService";
import { citiesService } from "@/services/citiesService";
import { Loader2, Plus, Trash2, Heart } from "lucide-react";

interface CreateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteCreated: () => void;
}

interface PetFormData {
  nombre: string;
  edad: string;
  genero: 'macho' | 'hembra' | '';
  raza: string;
  producto_preferido: string;
  notas_especiales: string;
}

const CreateCustomerModal = ({ open, onOpenChange, onClienteCreated }: CreateCustomerModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<Array<{ id: number; nombre: string; departamento: string }>>([]);
  
  const [formData, setFormData] = useState({
    nombre_completo: "",
    telefono: "",
    email: "",
    fkid_ciudad: "",
    canal_contacto: "",
    direccion_entrega: "",
    notas_especiales: ""
  });

  const [pets, setPets] = useState<PetFormData[]>([]);

  // Cargar ciudades al abrir el modal
  useEffect(() => {
    if (open) {
      loadCities();
    }
  }, [open]);

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (open) {
      setFormData({
        nombre_completo: "",
        telefono: "",
        email: "",
        fkid_ciudad: "",
        canal_contacto: "",
        direccion_entrega: "",
        notas_especiales: ""
      });
      setPets([]);
    }
  }, [open]);

  const loadCities = async () => {
    try {
      const response = await citiesService.getAllCities();
      if (response.success) {
        setCities(response.data.cities);
      }
    } catch (error) {
      console.error('Error al cargar ciudades:', error);
    }
  };

  const addPet = () => {
    setPets([...pets, {
      nombre: "",
      edad: "",
      genero: "",
      raza: "",
      producto_preferido: "",
      notas_especiales: ""
    }]);
  };

  const removePet = (index: number) => {
    setPets(pets.filter((_, i) => i !== index));
  };

  const updatePet = (index: number, field: keyof PetFormData, value: string) => {
    const updatedPets = [...pets];
    updatedPets[index] = { ...updatedPets[index], [field]: value };
    setPets(updatedPets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.nombre_completo || !formData.telefono || !formData.fkid_ciudad) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios: Nombre completo, Teléfono y Ciudad",
        variant: "destructive"
      });
      return;
    }

    // Validar email si se proporciona
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Error",
        description: "El email no tiene un formato válido",
        variant: "destructive"
      });
      return;
    }

    // Validar teléfono
    if (formData.telefono.length < 7 || formData.telefono.length > 20) {
      toast({
        title: "Error",
        description: "El teléfono debe tener entre 7 y 20 caracteres",
        variant: "destructive"
      });
      return;
    }

    // Validar mascotas
    for (let i = 0; i < pets.length; i++) {
      const pet = pets[i];
      if (!pet.nombre.trim()) {
        toast({
          title: "Error",
          description: `La mascota ${i + 1} debe tener un nombre`,
          variant: "destructive"
        });
        return;
      }
      if (pet.edad && (parseInt(pet.edad) < 0 || parseInt(pet.edad) > 30)) {
        toast({
          title: "Error",
          description: `La edad de la mascota ${i + 1} debe estar entre 0 y 30 años`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setLoading(true);

      // Crear cliente
      const clienteData: CreateClienteData = {
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono,
        email: formData.email || undefined,
        fkid_ciudad: parseInt(formData.fkid_ciudad),
        canal_contacto: formData.canal_contacto || undefined,
        direccion_entrega: formData.direccion_entrega || undefined,
        notas_especiales: formData.notas_especiales || undefined
      };

      const clienteResponse = await clientesService.createCliente(clienteData);

      if (clienteResponse.success) {
        const clienteId = clienteResponse.data.cliente.id;

        // Crear mascotas si las hay
        if (pets.length > 0) {
          const petPromises = pets.map(pet => {
            const petData: CreatePetData = {
              nombre: pet.nombre,
              edad: pet.edad ? parseInt(pet.edad) : undefined,
              genero: pet.genero || undefined,
              raza: pet.raza || undefined,
              producto_preferido: pet.producto_preferido || undefined,
              notas_especiales: pet.notas_especiales || undefined,
              fkid_cliente: clienteId
            };
            return petsService.createPet(petData);
          });

          await Promise.all(petPromises);
        }

        toast({
          title: "Cliente creado",
          description: `${formData.nombre_completo} y ${pets.length} mascota${pets.length !== 1 ? 's' : ''} registrado${pets.length !== 1 ? 's' : ''} exitosamente`,
        });
        onClienteCreated();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el cliente",
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
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Registra un nuevo cliente y sus mascotas en el sistema Miau Miau
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Cliente</CardTitle>
              <CardDescription>
                Datos básicos del cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                  <Input
                    id="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={(e) => handleInputChange('nombre_completo', e.target.value)}
                    placeholder="Nombre completo del cliente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="1234567890"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fkid_ciudad">Ciudad *</Label>
                  <Select value={formData.fkid_ciudad} onValueChange={(value) => handleInputChange('fkid_ciudad', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.nombre} - {city.departamento}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canal_contacto">Canal de Contacto</Label>
                <Select value={formData.canal_contacto} onValueChange={(value) => handleInputChange('canal_contacto', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un canal de contacto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Telefono">Teléfono</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Tienda">Tienda</SelectItem>
                    <SelectItem value="Recomendacion">Recomendación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion_entrega">Dirección de Entrega</Label>
                <Textarea
                  id="direccion_entrega"
                  value={formData.direccion_entrega}
                  onChange={(e) => handleInputChange('direccion_entrega', e.target.value)}
                  placeholder="Dirección completa para entregas"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas_especiales">Notas Especiales</Label>
                <Textarea
                  id="notas_especiales"
                  value={formData.notas_especiales}
                  onChange={(e) => handleInputChange('notas_especiales', e.target.value)}
                  placeholder="Información adicional sobre el cliente"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mascotas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Mascotas
                  </CardTitle>
                  <CardDescription>
                    Agrega las mascotas del cliente
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPet}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Mascota
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay mascotas agregadas</p>
                  <p className="text-sm">Haz clic en "Agregar Mascota" para comenzar</p>
                </div>
              ) : (
                pets.map((pet, index) => (
                  <Card key={index} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Mascota {index + 1}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePet(index)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre *</Label>
                          <Input
                            value={pet.nombre}
                            onChange={(e) => updatePet(index, 'nombre', e.target.value)}
                            placeholder="Nombre de la mascota"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Edad (años)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            value={pet.edad}
                            onChange={(e) => updatePet(index, 'edad', e.target.value)}
                            placeholder="Edad en años"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Género</Label>
                          <Select value={pet.genero} onValueChange={(value) => updatePet(index, 'genero', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona género" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="macho">Macho</SelectItem>
                              <SelectItem value="hembra">Hembra</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Raza</Label>
                          <Input
                            value={pet.raza}
                            onChange={(e) => updatePet(index, 'raza', e.target.value)}
                            placeholder="Raza de la mascota"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Producto Preferido</Label>
                        <Input
                          value={pet.producto_preferido}
                          onChange={(e) => updatePet(index, 'producto_preferido', e.target.value)}
                          placeholder="Producto favorito de la mascota"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Notas Especiales</Label>
                        <Textarea
                          value={pet.notas_especiales}
                          onChange={(e) => updatePet(index, 'notas_especiales', e.target.value)}
                          placeholder="Alergias, preferencias, cuidados especiales..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
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
              Crear Cliente {pets.length > 0 && `y ${pets.length} Mascota${pets.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCustomerModal;