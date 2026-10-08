import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Link2, Loader2, Plus, QrCode, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { hasSectionAccess } from "@/utils/permissions";
import {
  DEFAULT_QR_ACTIONS,
  QrActions,
  normalizePublicSiteSettings,
  siteSettingsService,
} from "@/services/siteSettingsService";
import QrLinksRichText from "@/components/QrLinksRichText";

const QR_LINK = "https://miaumiau.com.mx/QR";

type QrToggleId = "whatsapp" | "catalog" | "packages" | "promotions" | "mercadolibre" | "social";

function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const LINK_COLOR_FIELDS: { key: "linksPanelColor" | "linksBubbleColor" | "linksTextColor"; label: string }[] = [
  { key: "linksPanelColor", label: "Fondo del panel" },
  { key: "linksBubbleColor", label: "Color de las burbujas" },
  { key: "linksTextColor", label: "Color del texto del título, del texto y de las burbujas" },
];

const QR_ACTION_OPTIONS: { id: QrToggleId; title: string; description: string }[] = [
  {
    id: "whatsapp",
    title: "Pedir por WhatsApp",
    description: "Botón para hacer un pedido por WhatsApp",
  },
  {
    id: "catalog",
    title: "Catálogo",
    description: "Productos de arena",
  },
  {
    id: "packages",
    title: "Paquetes",
    description: "Paquetes y combos",
  },
  {
    id: "promotions",
    title: "Promociones",
    description: "Promociones activas",
  },
  {
    id: "mercadolibre",
    title: "Mercado Libre",
    description: "Se muestra solo si hay enlace de Mercado Libre en Sitio web",
  },
  {
    id: "social",
    title: "Redes sociales",
    description: "Instagram, Facebook y TikTok configurados en Sitio web",
  },
];

const ConfiguracionQr = () => {
  const { toast } = useToast();
  const canSave = hasSectionAccess("qr");
  const [actions, setActions] = useState<QrActions>(DEFAULT_QR_ACTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await siteSettingsService.getPublic();
        if (!cancelled && res.success) {
          setActions(normalizePublicSiteSettings(res.data).qrActions);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "No se pudo cargar la configuración del QR",
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

  const toggleAction = (id: QrToggleId | "customLink", checked: boolean) => {
    setActions((current) => ({ ...current, [id]: checked }));
  };

  const updateLink = (id: string, field: "name" | "url", value: string) => {
    setActions((current) => ({
      ...current,
      links: current.links.map((link) => (link.id === id ? { ...link, [field]: value } : link)),
    }));
  };

  const addLink = () => {
    setActions((current) => ({
      ...current,
      links: [...current.links, { id: `link-${Date.now()}`, name: "", url: "" }],
    }));
  };

  const removeLink = (id: string) => {
    setActions((current) => ({
      ...current,
      links: current.links.filter((link) => link.id !== id),
    }));
  };

  const handleSave = async () => {
    const links = actions.links.map((link) => ({
      ...link,
      name: link.name.trim(),
      url: link.url.trim(),
    }));
    const incomplete = links.find((link) => !link.name || !isHttpUrl(link.url));
    if (incomplete) {
      toast({
        title: "Enlace incompleto",
        description: incomplete.name
          ? `El enlace "${incomplete.name}" debe ser una URL http:// o https://`
          : "Cada enlace necesita un nombre y un link http:// o https://",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const res = await siteSettingsService.updateQrActions({
        ...actions,
        customLink: false,
        customLinkUrl: "",
        customLinkLabel: "",
        links,
      });
      if (res.success && res.data) {
        setActions(normalizePublicSiteSettings(res.data).qrActions);
      }
      toast({
        title: "Guardado",
        description: res.message ?? "Lo que se muestra al entrar al QR quedó actualizado",
      });
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudieron guardar las acciones",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!canSave) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración QR</h1>
        <p className="text-muted-foreground">
          Elige qué se muestra cuando alguien entra a la liga del QR
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,440px)_1fr] items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Código QR
            </CardTitle>
            <CardDescription>La liga vinculada es fija</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center rounded-lg border bg-white p-6">
              <QRCodeSVG
                value={QR_LINK}
                size={180}
                level="M"
                includeMargin
                aria-label={`Código QR hacia ${QR_LINK}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-link" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Liga vinculada
              </Label>
              <Input id="qr-link" value={QR_LINK} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Texto de la sección de enlaces</Label>
              <p className="text-sm text-muted-foreground">
                Reemplaza el encabezado «Miau Miau» y «Elige lo que quieres ver». La primera línea se ve como título.
              </p>
              <QrLinksRichText
                value={actions.linksHtml}
                disabled={!canSave || saving || loading}
                onChange={(linksHtml) => setActions((current) => ({ ...current, linksHtml }))}
              />
              <div className="space-y-3 pt-2">
                {LINK_COLOR_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={field.key}
                        type="color"
                        value={actions[field.key]}
                        disabled={!canSave || saving || loading}
                        className="h-10 w-14 cursor-pointer p-1"
                        onChange={(event) =>
                          setActions((current) => ({ ...current, [field.key]: event.target.value }))
                        }
                      />
                      <Input
                        value={actions[field.key]}
                        disabled={!canSave || saving || loading}
                        maxLength={7}
                        onChange={(event) =>
                          setActions((current) => ({ ...current, [field.key]: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qué mostrar al entrar</CardTitle>
            <CardDescription>
              Activa solo las acciones que quieres que vea quien escanee el código
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando…
              </div>
            ) : (
              <>
                <div className="divide-y rounded-lg border">
                  {QR_ACTION_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-center justify-between gap-4 p-4">
                      <div>
                        <Label htmlFor={`qr-action-${option.id}`} className="text-base">
                          {option.title}
                        </Label>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <Switch
                        id={`qr-action-${option.id}`}
                        checked={actions[option.id]}
                        disabled={!canSave || saving}
                        onCheckedChange={(checked) => toggleAction(option.id, checked)}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-medium">Enlaces</p>
                      <p className="text-sm text-muted-foreground">
                        Todos se muestran juntos, en la misma sección de la página del QR
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={addLink} disabled={!canSave || saving}>
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir enlace
                    </Button>
                  </div>
                  {actions.links.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Todavía no hay enlaces extra.</p>
                  ) : (
                    <div className="divide-y">
                    {actions.links.map((link, index) => (
                      <div key={link.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <div className="space-y-2">
                          <Label htmlFor={`qr-link-name-${link.id}`}>Nombre del Enlace</Label>
                          <Input
                            id={`qr-link-name-${link.id}`}
                            value={link.name}
                            disabled={!canSave || saving}
                            placeholder={`Enlace ${index + 1}`}
                            maxLength={80}
                            onChange={(event) => updateLink(link.id, "name", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`qr-link-url-${link.id}`}>Link</Label>
                          <Input
                            id={`qr-link-url-${link.id}`}
                            value={link.url}
                            disabled={!canSave || saving}
                            placeholder="https://"
                            onChange={(event) => updateLink(link.id, "url", event.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={!canSave || saving}
                          onClick={() => removeLink(link.id)}
                          aria-label={`Quitar ${link.name || "enlace"}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
                {canSave ? (
                  <Button type="button" onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Guardar acciones
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Solo un usuario con el permiso de configuración QR puede guardar estos cambios.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfiguracionQr;
