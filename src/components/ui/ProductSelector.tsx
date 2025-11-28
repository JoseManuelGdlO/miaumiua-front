import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Check, ChevronsUpDown, Package, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { inventariosService, Inventario } from "@/services/inventariosService";

interface ProductSelectorProps {
  value?: number;
  onValueChange: (product: Inventario | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ProductSelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Seleccionar producto...",
  disabled = false 
}: ProductSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Inventario | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const loadSpecificProduct = async (productId: number) => {
    try {
      const response = await inventariosService.getInventarioById(productId);
      if (response.success && response.data.inventario) {
        setSelectedProduct(response.data.inventario);
        // Agregar a la lista si no está
        setProducts(prevProducts => {
          if (!prevProducts.find(p => p.id === productId)) {
            return [...prevProducts, response.data.inventario];
          }
          return prevProducts;
        });
      }
    } catch (error) {
      console.error('Error al cargar producto específico:', error);
    }
  };

  const loadProducts = async (search: string) => {
    try {
      setLoading(true);
      const response = await inventariosService.getAllInventarios({
        search: search,
        limit: 50,
        activos: true
      });
      if (response.success) {
        setProducts(response.data.inventarios);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos iniciales
  useEffect(() => {
    loadProducts("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buscar productos cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadProducts(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Cargar producto seleccionado cuando cambie el value
  useEffect(() => {
    if (value && value > 0) {
      // Primero buscar en la lista actual
      const product = products.find(p => p.id === value);
      if (product) {
        setSelectedProduct(product);
      } else {
        // Si no está en la lista, cargar el producto específico
        // Esto funciona incluso si la lista aún no se ha cargado
        loadSpecificProduct(value);
      }
    } else {
      setSelectedProduct(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // También actualizar cuando la lista de productos cambie (por si el producto estaba en la lista)
  useEffect(() => {
    if (value && value > 0 && products.length > 0) {
      const product = products.find(p => p.id === value);
      if (product) {
        // Solo actualizar si el producto seleccionado es diferente o no existe
        if (!selectedProduct || selectedProduct.id !== value) {
          setSelectedProduct(product);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const handleSelect = (product: Inventario) => {
    setSelectedProduct(product);
    onValueChange(product);
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
          {selectedProduct ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Package className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">{selectedProduct.nombre}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {formatCurrency(selectedProduct.precio_venta)} • Stock: {selectedProduct.stock_inicial}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
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
              placeholder="Buscar productos..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Buscando productos...</span>
              </div>
            ) : products.length === 0 ? (
              <CommandEmpty>
                {searchTerm ? "No se encontraron productos" : "No hay productos disponibles"}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={`${product.nombre} ${product.sku || ''}`}
                    onSelect={() => handleSelect(product)}
                    className="flex items-center gap-3 p-3"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{product.nombre}</div>
                          {product.descripcion && (
                            <div className="text-xs text-muted-foreground truncate">
                              {product.descripcion}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatCurrency(product.precio_venta)}
                        </Badge>
                        <Badge 
                          variant={product.stock_inicial > 0 ? "default" : "destructive"} 
                          className="text-xs"
                        >
                          Stock: {product.stock_inicial}
                        </Badge>
                        {product.categoria && (
                          <Badge variant="outline" className="text-xs">
                            {product.categoria.nombre}
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

export default ProductSelector;
