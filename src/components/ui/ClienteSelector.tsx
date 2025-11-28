import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown, User, Search, Loader2, Phone, Mail, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { clientesService, Cliente, CreateClienteData } from "@/services/clientesService";
import { citiesService } from "@/services/citiesService";
import { useToast } from "@/hooks/use-toast";

interface ClienteSelectorProps {
  value?: number | string;
  onValueChange: (cliente: Cliente | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ClienteSelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Seleccionar cliente...",
  disabled = false 
}: ClienteSelectorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [cities, setCities] = useState<Array<{ id: number; nombre: string; departamento: string }>>([]);
  const [creating, setCreating] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const [newClienteData, setNewClienteData] = useState({
    nombre_completo: "",
    telefono: "",
    fkid_ciudad: ""
  });

  // Buscar clientes cuando cambie el término de búsqueda (solo si tiene 3+ caracteres)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Solo buscar si hay al menos 3 caracteres
    if (searchTerm.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        loadClientes(searchTerm.trim());
      }, 300);
    } else {
      // Si hay menos de 3 caracteres, limpiar los resultados
      setClientes([]);
      setLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Cargar cliente seleccionado cuando cambie el value
  useEffect(() => {
    if (value) {
      const clienteId = typeof value === 'string' ? parseInt(value) : value;
      if (clienteId && (!selectedCliente || selectedCliente.id !== clienteId)) {
        // Si el cliente ya está en la lista de resultados, usarlo
        const clienteEnLista = clientes.find(c => c.id === clienteId);
        if (clienteEnLista) {
          setSelectedCliente(clienteEnLista);
        } else {
          // Si no está en la lista actual, cargarlo por separado
          loadClienteById(clienteId);
        }
      }
    } else if (!value) {
      setSelectedCliente(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const loadClientes = async (search: string) => {
    if (!search || search.trim().length < 3) {
      setClientes([]);
      return;
    }

    try {
      setLoading(true);
      const response = await clientesService.getAllClientes({
        activos: 'true',
        search: search.trim(),
        limit: 100,
        page: 1
      });
      if (response.success) {
        setClientes(response.data.clientes);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClienteById = async (id: number) => {
    try {
      const response = await clientesService.getClienteById(id);
      if (response.success) {
        setSelectedCliente(response.data.cliente);
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error);
    }
  };

  const handleSelect = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    onValueChange(cliente);
    setOpen(false);
    setSearchTerm("");
  };

  // Cargar ciudades cuando se abre el modal de crear
  useEffect(() => {
    if (createModalOpen) {
      loadCities();
    }
  }, [createModalOpen]);

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

  const handleCreateCliente = async () => {
    if (!newClienteData.nombre_completo || !newClienteData.telefono || !newClienteData.fkid_ciudad) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos: Nombre, Teléfono y Ciudad",
        variant: "destructive"
      });
      return;
    }

    // Validar teléfono
    if (newClienteData.telefono.length < 7 || newClienteData.telefono.length > 20) {
      toast({
        title: "Error",
        description: "El teléfono debe tener entre 7 y 20 caracteres",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      const clienteData: CreateClienteData = {
        nombre_completo: newClienteData.nombre_completo.trim(),
        telefono: newClienteData.telefono.trim(),
        fkid_ciudad: parseInt(newClienteData.fkid_ciudad),
        canal_contacto: "WhatsApp"
      };

      const response = await clientesService.createCliente(clienteData);
      
      if (response.success) {
        toast({
          title: "Cliente creado",
          description: `Cliente "${response.data.cliente.nombre_completo}" creado exitosamente`,
        });
        
        // Seleccionar el nuevo cliente
        handleSelect(response.data.cliente);
        
        // Limpiar formulario y cerrar modal
        setNewClienteData({
          nombre_completo: "",
          telefono: "",
          fkid_ciudad: ""
        });
        setCreateModalOpen(false);
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el cliente",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCliente ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">{selectedCliente.nombre_completo}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {selectedCliente.telefono}
                  {selectedCliente.email && ` • ${selectedCliente.email}`}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-muted-foreground">{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Escribe al menos 3 letras para buscar..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {/* Botón para crear nuevo cliente */}
            <div className="border-b p-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setCreateModalOpen(true);
                  setOpen(false);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear nuevo cliente
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Buscando clientes...</span>
              </div>
            ) : searchTerm.trim().length < 3 ? (
              <CommandEmpty>
                Escribe al menos 3 letras para buscar clientes
              </CommandEmpty>
            ) : clientes.length === 0 ? (
              <CommandEmpty>
                No se encontraron clientes con "{searchTerm}"
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {clientes.map((cliente) => (
                  <CommandItem
                    key={cliente.id}
                    value={`${cliente.nombre_completo} ${cliente.telefono} ${cliente.email || ''}`}
                    onSelect={() => handleSelect(cliente)}
                    className="flex items-center gap-3 p-3"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCliente?.id === cliente.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{cliente.nombre_completo}</div>
                          {cliente.ciudad && (
                            <div className="text-xs text-muted-foreground truncate">
                              {cliente.ciudad.nombre}, {cliente.ciudad.departamento}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {cliente.telefono}
                        </Badge>
                        {cliente.email && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {cliente.email}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>

      {/* Modal para crear cliente rápido */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Completa los datos básicos del cliente. Los demás campos son opcionales.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_completo">Nombre Completo *</Label>
              <Input
                id="nombre_completo"
                value={newClienteData.nombre_completo}
                onChange={(e) => setNewClienteData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                placeholder="Ej: Juan Pérez"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={newClienteData.telefono}
                onChange={(e) => setNewClienteData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="Ej: +584121234567"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fkid_ciudad">Ciudad *</Label>
              <Select
                value={newClienteData.fkid_ciudad}
                onValueChange={(value) => setNewClienteData(prev => ({ ...prev, fkid_ciudad: value }))}
                disabled={creating}
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                setNewClienteData({
                  nombre_completo: "",
                  telefono: "",
                  fkid_ciudad: ""
                });
              }}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateCliente}
              disabled={creating}
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Popover>
  );
};

export default ClienteSelector;

