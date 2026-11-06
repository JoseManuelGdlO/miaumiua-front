import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertTriangle, Loader2, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { canConfigureSystem } from "@/utils/permissions";
import { siteSettingsService } from "@/services/siteSettingsService";

const ConfiguracionMaps = () => {
  const { toast } = useToast();
  const [mapsApiApagada, setMapsApiApagada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingMaps, setSavingMaps] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await siteSettingsService.getPublic();
        if (!cancelled && res.success && res.data) {
          setMapsApiApagada(res.data.mapsApiApagada === true);
        }
      } catch (e) {
        if (!cancelled) {
          toast({
            title: "Error",
            description: e instanceof Error ? e.message : "No se pudo cargar Maps",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleMapsChange = async (enabled: boolean) => {
    const previous = mapsApiApagada;
    setMapsApiApagada(enabled);
    try {
      setSavingMaps(true);
      const res = await siteSettingsService.updateMapsApiApagada(enabled);
      if (res.success && res.data) {
        setMapsApiApagada(res.data.mapsApiApagada === true);
      }
      toast({
        title: "Guardado",
        description: res.message ?? (enabled
          ? "Google Maps apagado"
          : "Google Maps encendido otra vez"),
      });
    } catch (err) {
      setMapsApiApagada(previous);
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setSavingMaps(false);
    }
  };

  if (!canConfigureSystem()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-6xl space-y-6 p-6">
      <div className="mb-2 flex items-center gap-3">
        <MapPin className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maps</h1>
          <p className="text-sm text-muted-foreground">
            Geocoding, Directions y el mapa embebido de Call Center
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando…
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex items-center gap-2 text-base font-semibold leading-tight">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Apagar Google Maps (emergencia)
                </h2>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                  Emergencia
                </span>
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">
                Corta Geocoding, Directions y el mapa embebido. El GPS del repartidor sigue y se abre Maps nativo con Ver ubicación.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:pl-4">
              <Label htmlFor="maps-api-apagada" className="text-sm font-medium">Apagar Maps</Label>
              <Switch
                id="maps-api-apagada"
                checked={mapsApiApagada}
                disabled={savingMaps}
                onCheckedChange={handleMapsChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfiguracionMaps;
