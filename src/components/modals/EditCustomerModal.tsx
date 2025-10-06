import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { clientesService, Cliente, UpdateClienteData } from "@/services/clientesService";
import { petsService, Pet, CreatePetData, UpdatePetData } from "@/services/petsService";
import { citiesService } from "@/services/citiesService";
import { Loader2, Plus, Trash2, Heart, Edit, Save, X } from "lucide-react";

interface EditCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
  onClienteUpdated: () => void;
}

interface PetFormData {
  id?: number;
  nombre: string;
  edad: string;
  genero: 'macho' | 'hembra' | '';
  raza: string;
  producto_preferido: string;
  notas_especiales: string;
  isNew?: boolean;
  isEditing?: boolean;
}

const EditCustomerModal = ({ open, onOpenChange, cliente, onClienteUpdated }: EditCustomerModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(false);
  const [cities, setCities] = useState<Array<{ id: number; nombre: string; departamento: string }>>([]);
  const [pets, setPets] = useState<PetFormData[]>([]);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    telefono: "",
    email: "",
    fkid_ciudad: "",
    canal_contacto: "",
    direccion_entrega: "",
    notas_especiales: ""
  });

  // Cargar ciudades y mascotas al abrir el modal
  useEffect(() => {
    if (open) {
      const initializeModal = async () => {
        await loadCities();
        if (cliente) {
          loadPets();
        }
      };
      initializeModal();
    }
  }, [open, cliente]);

  // Actualizar formulario cuando cambie el cliente
  useEffect(() => {
    if (cliente && open) {
      const ciudadValue = cliente.fkid_ciudad !== null && cliente.fkid_ciudad !== undefined 
        ? cliente.fkid_ciudad.toString() 
        : "";
      
      setFormData({
        nombre_completo: cliente.nombre_completo || "",
        telefono: cliente.telefono || "",
        email: cliente.email || "",
        fkid_ciudad: ciudadValue,
        canal_contacto: cliente.canal_contacto || "",
        direccion_entrega: cliente.direccion_entrega || "",
        notas_especiales: cliente.notas_especiales || ""
      });
    }
  }, [cliente, open]);

  // Asegurar que el valor de ciudad se establezca después de cargar las ciudades
  useEffect(() => {
    if (cliente && open && cities.length > 0 && !formData.fkid_ciudad) {
      const ciudadValue = cliente.fkid_ciudad !== null && cliente.fkid_ciudad !== undefined 
        ? cliente.fkid_ciudad.toString() 
        : "";
      
      setFormData(prev => ({
        ...prev,
        fkid_ciudad: ciudadValue
      }));
    }
  }, [cities, cliente, open, formData.fkid_ciudad]);

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

  const loadPets = async () => {
    if (!cliente) return;
    
    try {
      setPetsLoading(true);
      const response = await petsService.getPetsByClientId(cliente.id);
      if (response.success) {
        const petsData: PetFormData[] = response.data.mascotas.map(pet => ({
          id: pet.id,
          nombre: pet.nombre,
          edad: pet.edad?.toString() || "",
          genero: pet.genero || "",
          raza: pet.raza || "",
          producto_preferido: pet.producto_preferido || "",
          notas_especiales: pet.notas_especiales || "",
          isNew: false,
          isEditing: false
        }));
        setPets(petsData);
      }
    } catch (error) {
      console.error('Error al cargar mascotas:', error);
    } finally {
      setPetsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente) return;

    // Validaciones básicas
    if (!formData.nombre_completo || !formData.telefono || !formData.fkid_ciudad) {
      const missingFields = [];
      if (!formData.nombre_completo) missingFields.push('Nombre completo');
      if (!formData.telefono) missingFields.push('Teléfono');
      if (!formData.fkid_ciudad) missingFields.push('Ciudad');
      
      toast({
        title: "Error",
        description: `Por favor completa los campos obligatorios: ${missingFields.join(', ')}`,
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

    try {
      setLoading(true);

      const updateData: UpdateClienteData = {
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono,
        email: formData.email || undefined,
        fkid_ciudad: parseInt(formData.fkid_ciudad),
        canal_contacto: formData.canal_contacto || undefined,
        direccion_entrega: formData.direccion_entrega || undefined,
        notas_especiales: formData.notas_especiales || undefined
      };

      const response = await clientesService.updateCliente(cliente.id, updateData);

      if (response.success) {
        toast({
          title: "Cliente actualizado",
          description: `${formData.nombre_completo} ha sido actualizado exitosamente`,
        });
        onClienteUpdated();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el cliente",
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

  // Pet management functions
  const addPet = () => {
    const newPet: PetFormData = {
      nombre: "",
      edad: "",
      genero: "",
      raza: "",
      producto_preferido: "",
      notas_especiales: "",
      isNew: true,
      isEditing: true
    };
    setPets([...pets, newPet]);
  };

  const removePet = async (index: number) => {
    const pet = pets[index];
    
    // If it's a new pet, just remove from array
    if (pet.isNew) {
      setPets(pets.filter((_, i) => i !== index));
      return;
    }

    // If it's an existing pet, delete from API
    if (pet.id) {
      try {
        await petsService.deletePet(pet.id);
        setPets(pets.filter((_, i) => i !== index));
        toast({
          title: "Mascota eliminada",
          description: `${pet.nombre} ha sido eliminada`,
        });
      } catch (error) {
        console.error('Error al eliminar mascota:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la mascota",
          variant: "destructive"
        });
      }
    }
  };

  const editPet = (index: number) => {
    const updatedPets = [...pets];
    updatedPets[index].isEditing = true;
    setPets(updatedPets);
  };

  const cancelEditPet = (index: number) => {
    const pet = pets[index];
    
    if (pet.isNew) {
      // Remove new pet if canceling
      setPets(pets.filter((_, i) => i !== index));
    } else {
      // Reset to original values
      loadPets();
    }
  };

  const savePet = async (index: number) => {
    const pet = pets[index];
    
    // Validation
    if (!pet.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la mascota es obligatorio",
        variant: "destructive"
      });
      return;
    }

    if (pet.edad && (parseInt(pet.edad) < 0 || parseInt(pet.edad) > 30)) {
      toast({
        title: "Error",
        description: "La edad debe estar entre 0 y 30 años",
        variant: "destructive"
      });
      return;
    }

    try {
      if (pet.isNew) {
        // Create new pet
        const petData: CreatePetData = {
          nombre: pet.nombre,
          edad: pet.edad ? parseInt(pet.edad) : undefined,
          genero: pet.genero || undefined,
          raza: pet.raza || undefined,
          producto_preferido: pet.producto_preferido || undefined,
          notas_especiales: pet.notas_especiales || undefined,
          fkid_cliente: cliente!.id
        };

        const response = await petsService.createPet(petData);
        if (response.success) {
          const updatedPets = [...pets];
          updatedPets[index] = {
            ...pet,
            id: response.data.mascota.id,
            isNew: false,
            isEditing: false
          };
          setPets(updatedPets);
          
          toast({
            title: "Mascota creada",
            description: `${pet.nombre} ha sido agregada`,
          });
        }
      } else if (pet.id) {
        // Update existing pet
        const petData: UpdatePetData = {
          nombre: pet.nombre,
          edad: pet.edad ? parseInt(pet.edad) : undefined,
          genero: pet.genero || undefined,
          raza: pet.raza || undefined,
          producto_preferido: pet.producto_preferido || undefined,
          notas_especiales: pet.notas_especiales || undefined
        };

        const response = await petsService.updatePet(pet.id, petData);
        
        if (response.success) {
          const updatedPets = [...pets];
          updatedPets[index].isEditing = false;
          setPets(updatedPets);
          
          toast({
            title: "Mascota actualizada",
            description: `${pet.nombre} ha sido actualizada`,
          });
        }
      }
    } catch (error) {
      console.error('Error al guardar mascota:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la mascota",
        variant: "destructive"
      });
    }
  };

  const updatePet = (index: number, field: keyof PetFormData, value: string) => {
    const updatedPets = [...pets];
    updatedPets[index] = { ...updatedPets[index], [field]: value };
    setPets(updatedPets);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Modifica la información del cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Select 
                    value={formData.fkid_ciudad} 
                    onValueChange={(value) => handleInputChange('fkid_ciudad', value)}
                  >
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
                    Gestiona las mascotas del cliente
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPet}
                  disabled={loading || petsLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Mascota
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {petsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Cargando mascotas...</p>
                </div>
              ) : pets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay mascotas registradas</p>
                  <p className="text-sm">Haz clic en "Agregar Mascota" para comenzar</p>
                </div>
              ) : (
                pets.map((pet, index) => (
                  <Card key={index} className={`border-dashed ${pet.isNew ? 'border-blue-300 bg-blue-50/50' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {pet.isNew ? 'Nueva Mascota' : pet.nombre}
                          </CardTitle>
                          {pet.isNew && (
                            <Badge variant="secondary" className="text-xs">Nueva</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {pet.isEditing ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => cancelEditPet(index)}
                                disabled={loading}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={() => savePet(index)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Guardar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => editPet(index)}
                                disabled={loading}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePet(index)}
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pet.isEditing ? (
                        // Edit mode
                        <>
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
                        </>
                      ) : (
                        // View mode
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Nombre</Label>
                            <p className="text-sm text-muted-foreground">{pet.nombre}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Edad</Label>
                            <p className="text-sm text-muted-foreground">{pet.edad ? `${pet.edad} años` : 'No especificada'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Género</Label>
                            <p className="text-sm text-muted-foreground">{pet.genero || 'No especificado'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Raza</Label>
                            <p className="text-sm text-muted-foreground">{pet.raza || 'No especificada'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Producto Preferido</Label>
                            <p className="text-sm text-muted-foreground">{pet.producto_preferido || 'No especificado'}</p>
                          </div>
                          {pet.notas_especiales && (
                            <div className="md:col-span-2">
                              <Label className="text-sm font-medium">Notas Especiales</Label>
                              <p className="text-sm text-muted-foreground">{pet.notas_especiales}</p>
                            </div>
                          )}
                        </div>
                      )}
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
              Actualizar Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerModal;
