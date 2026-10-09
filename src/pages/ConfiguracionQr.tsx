import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

function hasVisibleRichText(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const LINK_COLOR_FIELDS: { key: "linksPanelColor"; label: string }[] = [
  { key: "linksPanelColor", label: "Fondo del panel" },
];

const ENLACE_COLOR_FIELDS: { key: "linksBubbleColor" | "linksBubbleTextColor"; label: string }[] = [
  { key: "linksBubbleColor", label: "Color de las burbujas" },
  { key: "linksBubbleTextColor", label: "Color del texto" },
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
    <div className="p-6 space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración QR</h1>
        <p className="text-muted-foreground">
          Elige qué se muestra cuando alguien entra a la liga del QR
        </p>
        <div className="mt-4 max-w-xl space-y-2">
          <Label htmlFor="qr-link" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Liga vinculada
          </Label>
          <Input id="qr-link" value={QR_LINK} readOnly />
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando…
              </div>
            ) : (
              <>
                <Accordion type="multiple" defaultValue={["mostrar", "enlaces"]} className="space-y-4">
                  <AccordionItem value="mostrar" className="rounded-lg border px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="text-left">
                        <span className="block text-base">Qué mostrar al entrar</span>
                        <span className="block text-sm font-normal text-muted-foreground">
                          Activa solo las acciones que quieres que vea quien escanee el código
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
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
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="enlaces" className="rounded-lg border px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="text-left">
                        <span className="block text-base">Enlaces</span>
                        <span className="block text-sm font-normal text-muted-foreground">
                          Todos se muestran juntos, en la misma sección de la página del QR
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="grid flex-1 gap-4 sm:grid-cols-2">
                          {ENLACE_COLOR_FIELDS.map((field) => (
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Texto de la sección de enlaces</CardTitle>
            <CardDescription>
              Reemplaza el encabezado «Miau Miau» y «Elige lo que quieres ver». La primera línea se ve como título.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid items-center gap-6 xl:grid-cols-2">
              <QrLinksRichText
                value={actions.linksHtml}
                disabled={!canSave || saving || loading}
                onChange={(linksHtml) => setActions((current) => ({ ...current, linksHtml }))}
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">Vista previa</p>
                <div
                  className="min-h-48 rounded-lg border px-4 py-10 text-center"
                  style={{ backgroundColor: actions.linksPanelColor, color: actions.linksTextColor }}
                >
                  {hasVisibleRichText(actions.linksHtml) ? (
                    <div
                      className="mx-auto max-w-3xl [&_a]:underline [&_font[size='1']]:text-xs [&_font[size='2']]:text-sm [&_font[size='3']]:text-base [&_font[size='4']]:text-lg [&_font[size='5']]:text-2xl [&_font[size='6']]:text-4xl [&_font[size='7']]:text-5xl [&_font[size='7']]:font-black [&_h2]:text-4xl [&_h2]:font-black [&_h3]:text-2xl [&_h3]:font-bold [&_img]:mx-auto [&_img]:my-4 [&_img]:max-h-80 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-left [&_p]:mb-3 [&_s]:line-through [&_strike]:line-through [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-left"
                      dangerouslySetInnerHTML={{
                        __html: actions.linksHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ""),
                      }}
                    />
                  ) : (
                    <>
                      <h2
                        className="text-4xl font-black md:text-6xl"
                        style={{ fontFamily: "'Fredoka', sans-serif", color: actions.linksTextColor }}
                      >
                        Miau Miau
                      </h2>
                      <p className="mt-3 text-lg" style={{ color: actions.linksTextColor }}>
                        Elige lo que quieres ver
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:max-w-md">
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
          </CardContent>
        </Card>
        {!loading && (
          canSave ? (
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar acciones
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Solo un usuario con el permiso de configuración QR puede guardar estos cambios.
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default ConfiguracionQr;
