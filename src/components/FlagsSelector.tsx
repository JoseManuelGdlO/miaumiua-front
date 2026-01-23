import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Check, ChevronsUpDown, Loader2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { flagsService, Flag } from "@/services/flagsService";
import { useToast } from "@/hooks/use-toast";

interface FlagsSelectorProps {
  value?: number[];
  onValueChange: (flagIds: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  showSelectedOnly?: boolean;
}

const FlagsSelector = ({
  value = [],
  onValueChange,
  placeholder = "Seleccionar flags...",
  disabled = false,
  showSelectedOnly = false,
}: FlagsSelectorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState<Flag[]>([]);

  // Cargar flags activos
  useEffect(() => {
    loadFlags();
  }, []);

  // Actualizar flags seleccionados cuando cambie el value
  useEffect(() => {
    if (value && value.length > 0) {
      const selected = flags.filter((flag) => value.includes(flag.id));
      setSelectedFlags(selected);
    } else {
      setSelectedFlags([]);
    }
  }, [value, flags]);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const response = await flagsService.getFlags({
        activos: 'true',
        limit: 100,
      });
      setFlags(response.data.flags || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar flags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = (flag: Flag) => {
    const currentIds = value || [];
    const isSelected = currentIds.includes(flag.id);

    let newIds: number[];
    if (isSelected) {
      newIds = currentIds.filter((id) => id !== flag.id);
    } else {
      newIds = [...currentIds, flag.id];
    }

    onValueChange(newIds);
  };

  const handleRemoveFlag = (flagId: number) => {
    const newIds = (value || []).filter((id) => id !== flagId);
    onValueChange(newIds);
  };

  const displayFlags = showSelectedOnly
    ? flags.filter((flag) => (value || []).includes(flag.id))
    : flags;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Tag className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">
                {selectedFlags.length > 0
                  ? `${selectedFlags.length} flag${selectedFlags.length > 1 ? "s" : ""} seleccionado${selectedFlags.length > 1 ? "s" : ""}`
                  : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar flags..." />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No se encontraron flags.</CommandEmpty>
                  <CommandGroup>
                    {displayFlags.map((flag) => {
                      const isSelected = (value || []).includes(flag.id);
                      return (
                        <CommandItem
                          key={flag.id}
                          value={flag.nombre}
                          onSelect={() => handleToggleFlag(flag)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: flag.color }}
                          />
                          <span>{flag.nombre}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Mostrar flags seleccionados como badges */}
      {selectedFlags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFlags.map((flag) => (
            <Badge
              key={flag.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              style={{
                backgroundColor: `${flag.color}20`,
                borderColor: flag.color,
                color: flag.color,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: flag.color }}
              />
              {flag.nombre}
              {!disabled && (
                <button
                  onClick={() => handleRemoveFlag(flag.id)}
                  className="ml-1 hover:bg-opacity-20 rounded-full p-0.5"
                  type="button"
                >
                  <span className="sr-only">Remover</span>
                  ×
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlagsSelector;
