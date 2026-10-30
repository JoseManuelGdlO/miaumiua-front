import { useEffect, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { citiesService, type CityWhatsapp } from "@/services/citiesService";

interface CityWhatsappCardProps {
  cityId: number;
  initial?: CityWhatsapp;
  canEdit: boolean;
}

const getStatusText = (whatsapp?: CityWhatsapp) => {
  if (whatsapp?.connected) return whatsapp.displayPhone || "WhatsApp conectado";
  if (whatsapp?.inviteStatus === "expired") return "Link vencido";
  if (!whatsapp || whatsapp.inviteStatus === "none") return "Sin link";
  return "Pendiente de vincular";
};

const CityWhatsappCard = ({ cityId, initial, canEdit }: CityWhatsappCardProps) => {
  const { toast } = useToast();
  const [whatsapp, setWhatsapp] = useState<CityWhatsapp | undefined>(initial);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setWhatsapp(initial);

    if (!canEdit) return;

    let active = true;
    const loadWhatsapp = async () => {
      try {
        setLoading(true);
        const response = await citiesService.getCityWhatsapp(cityId);
        if (active && response.success) setWhatsapp(response.data.whatsapp);
      } catch (error) {
        if (!active) return;
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo cargar el estado de WhatsApp",
          variant: "destructive",
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadWhatsapp();
    return () => {
      active = false;
    };
  }, [canEdit, cityId, initial, toast]);

  const copyInviteUrl = async () => {
    if (!whatsapp?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(whatsapp.inviteUrl);
      toast({ title: "Link copiado" });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar el link",
        variant: "destructive",
      });
    }
  };

  const regenerate = async () => {
    if (!window.confirm("El link anterior dejará de servir. ¿Generar uno nuevo?")) return;

    try {
      setUpdating(true);
      const response = await citiesService.regenerateCityWhatsapp(cityId);
      if (response.success) setWhatsapp(response.data.whatsapp);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar el link",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm("¿Desconectar WhatsApp de esta ciudad? Habrá que volver a vincular.")) return;

    try {
      setUpdating(true);
      const response = await citiesService.disconnectCityWhatsapp(cityId);
      if (response.success) setWhatsapp(response.data.whatsapp);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo desconectar WhatsApp",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const isConnected = Boolean(whatsapp?.connected);
  const canRegenerate = canEdit && !isConnected;

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div>
        <h3 className="font-semibold">WhatsApp</h3>
        {loading ? (
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando estado...
          </div>
        ) : (
          <div className="mt-1 text-sm">
            <p>{getStatusText(whatsapp)}</p>
            {isConnected && whatsapp?.coexistenceEnabled && (
              <p className="text-muted-foreground">coexistencia activa</p>
            )}
          </div>
        )}
      </div>

      {canEdit && !loading && !isConnected && whatsapp?.inviteUrl && (
        <div className="space-y-2">
          <div className="break-all rounded-md bg-muted p-3 text-sm">{whatsapp.inviteUrl}</div>
          {whatsapp.expiresAt && (
            <p className="text-xs text-muted-foreground">
              Vence: {new Date(whatsapp.expiresAt).toLocaleString("es-ES")}
            </p>
          )}
          <Button type="button" variant="outline" size="sm" onClick={copyInviteUrl}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar
          </Button>
        </div>
      )}

      {canEdit && !loading && (
        <div>
          {isConnected ? (
            <Button type="button" variant="destructive" size="sm" disabled={updating} onClick={disconnect}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desconectar
            </Button>
          ) : canRegenerate ? (
            <Button type="button" variant="secondary" size="sm" disabled={updating} onClick={regenerate}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar link nuevo
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default CityWhatsappCard;
