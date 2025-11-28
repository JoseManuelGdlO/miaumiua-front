import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Check, ChevronsUpDown, Package2, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { packagesService } from "@/services/packagesService";
import type { Package } from "@/services/packagesService";

interface PackageSelectorProps {
  value?: number;
  onValueChange: (pkg: Package | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PackageSelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Seleccionar paquete...",
  disabled = false 
}: PackageSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const loadSpecificPackage = async (packageId: number) => {
    try {
      const response = await packagesService.getPackageById(packageId);
      if (response.success && response.data.paquete) {
        setSelectedPackage(response.data.paquete);
        // Agregar a la lista si no está
        setPackages(prevPackages => {
          if (!prevPackages.find(p => p.id === packageId)) {
            return [...prevPackages, response.data.paquete];
          }
          return prevPackages;
        });
      }
    } catch (error) {
      console.error('Error al cargar paquete específico:', error);
    }
  };

  // Cargar paquetes iniciales
  useEffect(() => {
    loadPackages("");
  }, []);

  // Cargar paquete específico cuando se proporciona un value inicial
  useEffect(() => {
    if (value) {
      // Verificar si el paquete seleccionado actual coincide con el value
      if (!selectedPackage || selectedPackage.id !== value) {
        // Cargar el paquete específico inmediatamente si hay un value
        loadSpecificPackage(value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Buscar paquetes cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadPackages(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Cargar paquete seleccionado cuando cambie el value
  useEffect(() => {
    if (value) {
      // Buscar en la lista actual
      const pkg = packages.find(p => p.id === value);
      if (pkg) {
        setSelectedPackage(pkg);
      } else {
        // Si no está en la lista, cargar el paquete específico
        loadSpecificPackage(value);
      }
    } else {
      setSelectedPackage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, packages]);

  const loadPackages = async (search: string) => {
    try {
      setLoading(true);
      const response = await packagesService.getAllPackages({
        search: search,
        limit: 50
        // No filtrar por activos para mostrar todos, pero podemos filtrar en el frontend
      });
      if (response.success) {
        // Filtrar solo paquetes activos
        const activePackages = response.data.paquetes.filter(p => p.is_active);
        setPackages(activePackages);
      }
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    onValueChange(pkg);
    setOpen(false);
    setSearchTerm("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
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
          {selectedPackage ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Package2 className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">{selectedPackage.nombre}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {formatCurrency(selectedPackage.precio_final)}
                  {selectedPackage.descuento && selectedPackage.descuento > 0 && (
                    <> • {selectedPackage.descuento}% desc.</>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Package2 className="h-4 w-4" />
              <span className="text-muted-foreground">{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Buscar paquetes..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Buscando paquetes...</span>
              </div>
            ) : packages.length === 0 ? (
              <CommandEmpty>
                {searchTerm ? "No se encontraron paquetes" : "No hay paquetes disponibles"}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {packages.map((pkg) => (
                  <CommandItem
                    key={pkg.id}
                    value={`${pkg.nombre} ${pkg.descripcion || ''}`}
                    onSelect={() => handleSelect(pkg)}
                    className="flex items-center gap-3 p-3"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedPackage?.id === pkg.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{pkg.nombre}</div>
                          {pkg.descripcion && (
                            <div className="text-xs text-muted-foreground truncate">
                              {pkg.descripcion}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatCurrency(pkg.precio_final)}
                        </Badge>
                        {pkg.descuento && pkg.descuento > 0 && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            {pkg.descuento}% desc.
                          </Badge>
                        )}
                        {pkg.productos && pkg.productos.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {pkg.productos.length} productos
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
    </Popover>
  );
};

export default PackageSelector;

