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
import { Check, ChevronsUpDown, Tag, Search, Loader2, Calendar, Percent, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { promotionsService, Promotion } from "@/services/promotionsService";

interface PromotionSelectorProps {
  value?: string;
  onValueChange: (promotion: Promotion | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PromotionSelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Seleccionar promoción...",
  disabled = false 
}: PromotionSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Cargar promociones iniciales
  useEffect(() => {
    loadPromotions("");
  }, []);

  // Buscar promociones cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadPromotions(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Cargar promoción seleccionada cuando cambie el value
  useEffect(() => {
    if (value && promotions.length > 0) {
      const promotion = promotions.find(p => p.codigo === value);
      if (promotion) {
        setSelectedPromotion(promotion);
      }
    } else if (!value) {
      setSelectedPromotion(null);
    }
  }, [value, promotions]);

  const loadPromotions = async (search: string) => {
    try {
      setLoading(true);
      const response = await promotionsService.getAllPromotions({
        search: search,
        limit: 50,
        activos: true,
        include_cities: true
      });
      if (response.success) {
        setPromotions(response.data.promotions);
      }
    } catch (error) {
      console.error('Error al cargar promociones:', error);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (promotion: Promotion) => {
    // Si la promoción ya está seleccionada, deseleccionarla
    if (selectedPromotion?.id === promotion.id) {
      setSelectedPromotion(null);
      onValueChange(null);
    } else {
      setSelectedPromotion(promotion);
      onValueChange(promotion);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPromotionTypeBadge = (type: string) => {
    const typeConfig = {
      porcentaje: { label: 'Porcentaje', variant: 'default' as const, icon: Percent },
      monto_fijo: { label: 'Monto Fijo', variant: 'secondary' as const, icon: Tag },
      envio_gratis: { label: 'Envío Gratis', variant: 'default' as const, icon: Tag },
      descuento_especial: { label: 'Especial', variant: 'default' as const, icon: Tag }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.porcentaje;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.fecha_inicio);
    const endDate = new Date(promotion.fecha_fin);
    return now >= startDate && now <= endDate;
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
          {selectedPromotion ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Tag className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">{selectedPromotion.nombre}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {selectedPromotion.codigo} • {getPromotionTypeBadge(selectedPromotion.tipo_promocion).props.children[1]}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="text-muted-foreground">{placeholder}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {selectedPromotion && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPromotion(null);
                  onValueChange(null);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Buscar promociones..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Buscando promociones...</span>
              </div>
            ) : promotions.length === 0 ? (
              <CommandEmpty>
                {searchTerm ? "No se encontraron promociones" : "No hay promociones disponibles"}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {promotions.map((promotion) => (
                  <CommandItem
                    key={promotion.id}
                    value={`${promotion.nombre} ${promotion.codigo}`}
                    onSelect={() => handleSelect(promotion)}
                    className="flex items-center gap-3 p-3"
                    disabled={!isPromotionActive(promotion)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedPromotion?.id === promotion.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{promotion.nombre}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            Código: {promotion.codigo}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getPromotionTypeBadge(promotion.tipo_promocion)}
                        <Badge variant="outline" className="text-xs">
                          {promotion.tipo_promocion === 'porcentaje' 
                            ? `${promotion.valor_descuento}%`
                            : formatCurrency(promotion.valor_descuento)
                          }
                        </Badge>
                        <Badge 
                          variant={isPromotionActive(promotion) ? "default" : "secondary"} 
                          className="text-xs"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(promotion.fecha_fin)}
                        </Badge>
                      </div>
                      {promotion.compra_minima && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Compra mínima: {formatCurrency(promotion.compra_minima)}
                        </div>
                      )}
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

export default PromotionSelector;
