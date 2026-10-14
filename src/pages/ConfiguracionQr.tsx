import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { ExternalLink, Eye, Link2, Loader2, Pencil, Plus, QrCode, Save, Trash2, Type, Upload } from "lucide-react";
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

function visibleText(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function hasVisibleRichText(html: string) {
  if (/<img\b/i.test(html)) return true;
  return visibleText(html).length > 0;
}

const DEFAULT_EDITOR_HTML = '<div style="text-align:center;color:#000000;font-family:Fredoka,sans-serif"><h2 style="color:#000000;font-family:Fredoka,sans-serif;font-weight:700">Miau Miau</h2><p style="color:#000000;font-family:Fredoka,sans-serif;font-weight:600">Elige lo que quieres ver</p></div>';

function withEditableHeading(html: string) {
  const textHtml = html.replace(/<img\b[^>]*>/gi, "").replace(/<p[^>]*>\s*<\/p>/gi, "");
  if (visibleText(textHtml).length > 0) return textHtml;
  return DEFAULT_EDITOR_HTML;
}

function withExistingLinks(actions: QrActions, data: { mercadolibreUrl?: string; socialTiktokUrl?: string }) {
  const restored = [
    { name: "WHATSAPP POR CIUDAD", url: "https://linktr.ee/miaumiauarena" },
    { name: "MERCADO LIBRE", url: data.mercadolibreUrl?.trim() ?? "" },
    { name: "TIKTOK", url: data.socialTiktokUrl?.trim() ?? "" },
  ].filter((item) => item.url && !actions.links.some((link) => link.name.trim().toUpperCase() === item.name));
  return {
    ...actions,
    linksHtml: withEditableHeading(actions.linksHtml),
    links: [
      ...actions.links,
      ...restored.map((item) => ({ id: `link-${item.name.toLowerCase().replace(/\s+/g, "-")}`, name: item.name, url: item.url })),
    ],
  };
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const LINK_COLOR_FIELDS: { key: "linksPanelColor" | "linksTextColor"; label: string }[] = [
  { key: "linksPanelColor", label: "Fondo del panel" },
  { key: "linksTextColor", label: "Color del texto" },
];

const ENLACE_COLOR_FIELDS: { key: "linksBubbleColor" | "linksBubbleTextColor"; label: string }[] = [
  { key: "linksBubbleColor", label: "Color de las burbujas" },
  { key: "linksBubbleTextColor", label: "Color del texto" },
];

function ColorSettingCard({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    if (disabled) return;
    pickerRef.current?.click();
  };

  return (
    <div className="space-y-2 rounded-xl border bg-card p-4">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2 rounded-lg border bg-background px-2">
        <button
          type="button"
          disabled={disabled}
          onClick={openPicker}
          aria-label={`Elegir ${label}`}
          className="h-7 w-7 shrink-0 rounded-md border"
          style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000" }}
        />
        <input
          ref={pickerRef}
          id={id}
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          value={value}
          disabled={disabled}
          maxLength={7}
          className="h-10 border-0 px-0 font-mono shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          onChange={(event) => onChange(event.target.value)}
        />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={disabled} onClick={openPicker} aria-label={`Editar ${label}`}>
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

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
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [draggingBackground, setDraggingBackground] = useState(false);
  const backgroundFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await siteSettingsService.getPublic();
        if (!cancelled && res.success) {
          setActions(withExistingLinks(normalizePublicSiteSettings(res.data).qrActions, res.data));
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

  useEffect(() => {
    setActions((current) => {
      const next = withEditableHeading(current.linksHtml);
      if (next === current.linksHtml) return current;
      return { ...current, linksHtml: next };
    });
  }, [actions.linksHtml]);

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

  const uploadBackground = async (file: File) => {
    if (!canSave || uploadingBackground) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo no válido",
        description: "Sube una imagen JPG, PNG, GIF o WebP",
        variant: "destructive",
      });
      return;
    }
    setUploadingBackground(true);
    try {
      const url = await siteSettingsService.uploadQrImage(file);
      setActions((current) => ({ ...current, linksBackgroundImage: url }));
    } catch (error) {
      toast({
        title: "No se pudo subir la foto",
        description: error instanceof Error ? error.message : "Intenta con otra imagen",
        variant: "destructive",
      });
    } finally {
      setUploadingBackground(false);
    }
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
        setActions(withExistingLinks(normalizePublicSiteSettings(res.data).qrActions, res.data));
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
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
          <QrCode className="h-5 w-5 text-primary" />
          Configuración QR
        </h1>
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
                        <span className="flex items-center gap-2 text-base">
                          <Eye className="h-5 w-5 text-primary" />
                          Qué mostrar al entrar
                        </span>
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
                        <span className="flex items-center gap-2 text-base">
                          <Link2 className="h-5 w-5 text-primary" />
                          Enlaces
                        </span>
                        <span className="block text-sm font-normal text-muted-foreground">
                          Todos se muestran juntos, en la misma sección de la página del QR
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="grid flex-1 gap-4 sm:grid-cols-2">
                          {ENLACE_COLOR_FIELDS.map((field) => (
                            <ColorSettingCard
                              key={field.key}
                              id={field.key}
                              label={field.label}
                              value={actions[field.key]}
                              disabled={!canSave || saving || loading}
                              onChange={(next) => setActions((current) => ({ ...current, [field.key]: next }))}
                            />
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
                        <div className="space-y-3">
                          {actions.links.map((link, index) => (
                            <div key={link.id} className="rounded-xl border p-4">
                              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                                <div className="space-y-2">
                                  <Label htmlFor={`qr-link-name-${link.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">Nombre del enlace</Label>
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
                                  <Label htmlFor={`qr-link-url-${link.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">Link</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id={`qr-link-url-${link.id}`}
                                      value={link.url}
                                      disabled={!canSave || saving}
                                      placeholder="https://"
                                      onChange={(event) => updateLink(link.id, "url", event.target.value)}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={!isHttpUrl(link.url)}
                                      aria-label={`Abrir ${link.name || "enlace"}`}
                                      onClick={() => window.open(link.url.trim(), "_blank", "noopener,noreferrer")}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </div>
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
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              Texto de la sección de enlaces
            </CardTitle>
            <CardDescription>
              Reemplaza el encabezado «Miau Miau» y «Elige lo que quieres ver». La primera línea se ve como título.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="qr-background-image">Imagen de fondo</Label>
              <div
                onClick={() => {
                  if (!canSave || saving || loading || uploadingBackground) return;
                  backgroundFileRef.current?.click();
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!canSave || saving || loading || uploadingBackground) return;
                  setDraggingBackground(true);
                }}
                onDragLeave={() => setDraggingBackground(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDraggingBackground(false);
                  if (!canSave || saving || loading || uploadingBackground) return;
                  const file = event.dataTransfer.files?.[0];
                  if (file) void uploadBackground(file);
                }}
                className={`flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  draggingBackground ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                } ${!canSave || saving || loading || uploadingBackground ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              >
                <input
                  ref={backgroundFileRef}
                  id="qr-background-image"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void uploadBackground(file);
                  }}
                />
                {uploadingBackground ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Subiendo imagen…
                  </div>
                ) : actions.linksBackgroundImage ? (
                  <>
                    <img
                      src={actions.linksBackgroundImage}
                      alt="Fondo de la sección"
                      className="max-h-40 w-full rounded-md object-cover"
                    />
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <p className="text-sm text-muted-foreground">Arrastra otra imagen para reemplazarla, o haz clic</p>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={!canSave || saving || loading}
                        onClick={(event) => {
                          event.stopPropagation();
                          setActions((current) => ({ ...current, linksBackgroundImage: "" }));
                        }}
                      >
                        Quitar
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-primary" />
                    <p className="text-sm">
                      <span className="font-medium text-primary">Haz clic para subir</span>
                      <span className="text-muted-foreground"> o arrastra la imagen aquí</span>
                    </p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, GIF o WebP (Recomendado 1080 x 1920 px)</p>
                  </>
                )}
              </div>
            </div>
            <QrLinksRichText
              value={actions.linksHtml}
              disabled={!canSave || saving || loading}
              panelColor={actions.linksPanelColor}
              textColor={actions.linksTextColor}
              backgroundImage={actions.linksBackgroundImage}
              onChange={(linksHtml) => setActions((current) => ({ ...current, linksHtml }))}
              toolbarExtra={
                <div className="grid gap-4 sm:grid-cols-2">
                  {LINK_COLOR_FIELDS.map((field) => (
                    <ColorSettingCard
                      key={field.key}
                      id={field.key}
                      label={field.label}
                      value={actions[field.key]}
                      disabled={!canSave || saving || loading}
                      onChange={(next) => setActions((current) => ({ ...current, [field.key]: next }))}
                    />
                  ))}
                </div>
              }
              preview={
                <div className="flex h-full min-h-72 flex-col gap-2">
                  <p className="text-sm font-medium">Vista previa</p>
                  <div
                    className="relative min-h-0 flex-1 overflow-hidden rounded-lg border text-center"
                    style={{
                      backgroundColor: actions.linksPanelColor,
                      color: actions.linksTextColor,
                      backgroundImage: actions.linksBackgroundImage
                        ? `url("${actions.linksBackgroundImage.replace(/"/g, "")}")`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {actions.linksBackgroundImage ? (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{ backgroundColor: actions.linksPanelColor, opacity: 0.72 }}
                      />
                    ) : null}
                    <span className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-full bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                      Render
                    </span>
                    <div className="relative flex h-full min-h-64 items-center justify-center px-4 py-10">
                      {hasVisibleRichText(actions.linksHtml) ? (
                        <div
                          className="mx-auto max-w-3xl [&_a]:underline [&_font[size='1']]:text-xs [&_font[size='2']]:text-sm [&_font[size='3']]:text-base [&_font[size='4']]:text-lg [&_font[size='5']]:text-2xl [&_font[size='6']]:text-4xl [&_font[size='7']]:text-5xl [&_font[size='7']]:font-black [&_h2]:text-4xl [&_h2]:font-black [&_h3]:text-2xl [&_h3]:font-bold [&_img]:mx-auto [&_img]:my-4 [&_img]:max-h-80 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-left [&_p]:mb-3 [&_s]:line-through [&_strike]:line-through [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-left"
                          dangerouslySetInnerHTML={{
                            __html: actions.linksHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ""),
                          }}
                        />
                      ) : (
                        <div>
                          <h2
                            className="text-4xl font-black md:text-6xl"
                            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, color: "#000000" }}
                          >
                            Miau Miau
                          </h2>
                          <p className="mt-3 text-lg" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, color: "#000000" }}>
                            Elige lo que quieres ver
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              }
            />
          </CardContent>
        </Card>
        {!loading && (
          canSave ? (
            <Button type="button" className="rounded-xl px-5" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar configuración
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
