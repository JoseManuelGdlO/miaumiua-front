import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Eye, Link2, Loader2, QrCode, Save, Type, Upload } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { hasSectionAccess } from "@/utils/permissions";
import { config } from "@/config/environment";
import {
  DEFAULT_QR_ACTIONS,
  QrActions,
  normalizePublicSiteSettings,
  siteSettingsService,
  withVisualState,
} from "@/services/siteSettingsService";
import QrCardsEditor from "@/components/QrCardsEditor";
import QrLinkCardGrid, { type QrDisplayCard } from "@/components/QrLinkCardGrid";
import QrLinksRichText from "@/components/QrLinksRichText";

const QR_LINK = "https://miaumiau.com.mx/QR";

type QrToggleId = "whatsapp" | "catalog" | "packages" | "promotions" | "mercadolibre" | "social";

function visibleText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function hasVisibleRichText(html: string) {
  if (/<img\b/i.test(html)) return true;
  return visibleText(html).length > 0;
}

const LOGO_HTML = '<p style="text-align:center"><img src="/miau-logo-mark.png" alt="Miau Miau"></p>';
const DEFAULT_EDITOR_HTML = `${LOGO_HTML}<div style="text-align:center;color:#000000;font-family:Fredoka,sans-serif"><h2 style="color:#000000;font-family:Fredoka,sans-serif;font-weight:700">Miau Miau</h2><p style="color:#000000;font-family:Fredoka,sans-serif;font-weight:600">Elige lo que quieres ver</p></div>`;

function withEditableHeading(html: string) {
  const cleaned = html.replace(/<p[^>]*>\s*<\/p>/gi, "");
  if (/<img\b/i.test(cleaned)) return cleaned;
  const text = visibleText(cleaned).replace(/\s+/g, " ");
  if (!text || text === "Miau Miau Elige lo que quieres ver") return DEFAULT_EDITOR_HTML;
  return cleaned;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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

type SaveSection = "toggles" | "links" | "text";

const TOGGLE_IDS: QrToggleId[] = ["whatsapp", "catalog", "packages", "promotions", "mercadolibre", "social"];

function textFieldsOf(actions: QrActions) {
  return {
    linksHtml: actions.linksHtml,
    linksPanelColor: actions.linksPanelColor,
    linksTextColor: actions.linksTextColor,
    linksBackgroundImage: actions.linksBackgroundImage,
  };
}

function completeLinks(links: QrActions["links"]) {
  return links
    .map((link) => ({
      ...link,
      name: link.name.trim(),
      url: link.url.trim(),
      description: link.description.trim(),
    }))
    .filter((link) => link.name && isHttpUrl(link.url));
}

function buildPayload(section: SaveSection, current: QrActions, saved: QrActions): QrActions {
  const next: QrActions = {
    ...saved,
    customLink: false,
    customLinkUrl: "",
    customLinkLabel: "",
  };
  if (section === "toggles") {
    for (const id of TOGGLE_IDS) next[id] = current[id];
  } else if (section === "links") {
    next.links = completeLinks(current.links);
    next.cards = current.cards;
    next.cardOrder = current.cardOrder.filter((id) =>
      id === "mercadolibre" || id === "instagram" || id === "facebook" || id === "tiktok" || next.links.some((link) => link.id === id),
    );
    next.linksBubbleColor = current.linksBubbleColor;
    next.linksBubbleTextColor = current.linksBubbleTextColor;
  } else {
    Object.assign(next, textFieldsOf(current));
  }
  return withVisualState(next);
}

type SiteLinks = {
  mercadolibreUrl: string;
  socialInstagramUrl: string;
  socialFacebookUrl: string;
  socialTiktokUrl: string;
};

const EMPTY_SITE_LINKS: SiteLinks = {
  mercadolibreUrl: "",
  socialInstagramUrl: "",
  socialFacebookUrl: "",
  socialTiktokUrl: "",
};

type SectionPreview = { status: "idle" | "loading" | "ready" | "error"; names: string[] };

const idleSection: SectionPreview = { status: "idle", names: [] };

function namesFrom(json: unknown, listKey: string) {
  const data = (json as { data?: Record<string, { nombre?: string }[] | undefined> })?.data;
  const list = data?.[listKey];
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    const name = item?.nombre?.trim();
    return name ? [name] : [];
  });
}

function QrPagePreview({
  open,
  onOpenChange,
  actions,
  siteLinks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: QrActions;
  siteLinks: SiteLinks;
}) {
  const [catalog, setCatalog] = useState<SectionPreview>(idleSection);
  const [packages, setPackages] = useState<SectionPreview>(idleSection);
  const [promotions, setPromotions] = useState<SectionPreview>(idleSection);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async (
      enabled: boolean,
      path: string,
      listKey: string,
      setSection: (value: SectionPreview) => void,
    ) => {
      if (!enabled) {
        setSection(idleSection);
        return;
      }
      setSection({ status: "loading", names: [] });
      try {
        const response = await fetch(`${config.apiBaseUrl}${path}`);
        if (!response.ok) throw new Error("No se pudo cargar");
        const names = namesFrom(await response.json(), listKey);
        if (!cancelled) setSection({ status: "ready", names });
      } catch {
        if (!cancelled) setSection({ status: "error", names: [] });
      }
    };
    void load(actions.catalog, "/inventarios/catalogo", "productos", setCatalog);
    void load(actions.packages, "/paquetes/activos", "paquetes", setPackages);
    void load(actions.promotions, "/promotions/active", "promotions", setPromotions);
    return () => {
      cancelled = true;
    };
  }, [open, actions.catalog, actions.packages, actions.promotions]);

  const featuredCard: QrDisplayCard | null = actions.whatsapp && !actions.cards.whatsapp.hidden
    ? { id: "whatsapp", ...actions.cards.whatsapp }
    : null;
  const previewCards: QrDisplayCard[] = actions.cardOrder.flatMap((id) => {
    if (id === "mercadolibre") {
      return actions.mercadolibre && !actions.cards.mercadolibre.hidden && siteLinks.mercadolibreUrl.trim()
        ? [{ id, ...actions.cards.mercadolibre }]
        : [];
    }
    if (id === "instagram" || id === "facebook" || id === "tiktok") {
      const url = id === "instagram"
        ? siteLinks.socialInstagramUrl
        : id === "facebook"
          ? siteLinks.socialFacebookUrl
          : siteLinks.socialTiktokUrl;
      return actions.social && !actions.cards[id].hidden && url.trim() ? [{ id, ...actions.cards[id] }] : [];
    }
    const link = actions.links.find((item) => item.id === id);
    if (!link || link.hidden || !link.name.trim() || !isHttpUrl(link.url)) return [];
    return [{
      id: link.id,
      name: link.name,
      description: link.description,
      icon: link.icon,
      size: link.size,
      iconBackgroundColor: link.iconBackgroundColor,
      cardColor: link.cardColor,
      iconColor: link.iconColor,
    }];
  });
  const sections = [
    actions.catalog
      ? { title: "Nuestros Productos", state: catalog, loading: "Cargando productos...", empty: "Por ahora no hay productos disponibles.", error: "No pudimos cargar los productos." }
      : null,
    actions.packages
      ? { title: "Paquetes y Combos", state: packages, loading: "Cargando paquetes...", empty: "Por ahora no hay paquetes disponibles.", error: "No pudimos cargar los paquetes." }
      : null,
    actions.promotions
      ? { title: "Promociones", state: promotions, loading: "Cargando promociones...", empty: "Lo sentimos, por el momento no tenemos promociones.", error: "No pudimos cargar las promociones." }
      : null,
  ].filter((section): section is { title: string; state: SectionPreview; loading: string; empty: string; error: string } => section !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(94vh,860px)] w-[min(100%-1.5rem,980px)] max-w-[980px] flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-[980px]">
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12">
          <DialogTitle>Vista previa del QR</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-white text-neutral-950">
          <section
            className="px-4 py-8 text-center"
            style={{
              backgroundColor: actions.linksPanelColor || "#ffffff",
              backgroundImage: actions.linksBackgroundImage
                ? `url("${actions.linksBackgroundImage.replace(/"/g, "")}")`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {hasVisibleRichText(actions.linksHtml) && (
              <div
                className="mx-auto mt-8 max-w-3xl [&_a]:underline [&_h2]:text-4xl [&_h2]:font-black [&_h3]:text-2xl [&_h3]:font-bold [&_img]:mx-auto [&_img]:my-4 [&_img]:max-h-96 [&_img]:max-w-full [&_p]:mb-3"
                style={{ color: actions.linksTextColor, fontFamily: "'Fredoka', sans-serif" }}
                dangerouslySetInnerHTML={{ __html: actions.linksHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "") }}
              />
            )}
            <QrLinkCardGrid featured={featuredCard} cards={previewCards} />
          </section>
          {sections.map((section) => (
            <section key={section.title} className="border-t bg-white px-4 py-10 text-center">
              <h2 className="text-3xl font-black" style={{ fontFamily: "'Fredoka', sans-serif" }}>{section.title}</h2>
              {section.state.status === "loading" && <p className="mt-4 text-neutral-500">{section.loading}</p>}
              {section.state.status === "error" && <p className="mt-4 text-neutral-500">{section.error}</p>}
              {section.state.status === "ready" && section.state.names.length === 0 && (
                <p className="mt-4 text-neutral-500">{section.empty}</p>
              )}
              {section.state.status === "ready" && section.state.names.length > 0 && (
                <ul className="mx-auto mt-6 max-w-xl space-y-2 text-left">
                  {section.state.names.map((name, index) => (
                    <li key={`${section.title}-${index}`} className="rounded-xl border px-4 py-3 font-medium">{name}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ConfiguracionQr = () => {
  const { toast } = useToast();
  const canSave = hasSectionAccess("qr");
  const [actions, setActions] = useState<QrActions>(DEFAULT_QR_ACTIONS);
  const [siteLinks, setSiteLinks] = useState<SiteLinks>(EMPTY_SITE_LINKS);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<SaveSection | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [draggingBackground, setDraggingBackground] = useState(false);
  const backgroundFileRef = useRef<HTMLInputElement>(null);
  const actionsRef = useRef(actions);
  const savedRef = useRef<QrActions>(DEFAULT_QR_ACTIONS);
  const saveQueueRef = useRef(Promise.resolve());

  const remember = (next: QrActions) => {
    actionsRef.current = next;
    return next;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await siteSettingsService.getPublic();
        if (!cancelled && res.success) {
          const normalized = normalizePublicSiteSettings(res.data).qrActions;
          const next = { ...normalized, linksHtml: withEditableHeading(normalized.linksHtml) };
          actionsRef.current = next;
          savedRef.current = next;
          setActions(next);
          setSiteLinks({
            mercadolibreUrl: res.data.mercadolibreUrl ?? "",
            socialInstagramUrl: res.data.socialInstagramUrl ?? "",
            socialFacebookUrl: res.data.socialFacebookUrl ?? "",
            socialTiktokUrl: res.data.socialTiktokUrl ?? "",
          });
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
      return remember({ ...current, linksHtml: next });
    });
  }, [actions.linksHtml]);

  const saveMessages: Record<SaveSection, string> = {
    toggles: "Lo que se muestra al entrar quedó publicado",
    links: "Los enlaces quedaron publicados",
    text: "El texto de la sección quedó publicado",
  };

  const enqueueSave = (section: SaveSection) => {
    if (!canSave) return;
    if (section === "links") {
      const incomplete = actionsRef.current.links.find((link) => !link.name.trim() || !isHttpUrl(link.url));
      if (incomplete) {
        toast({
          title: "Enlace incompleto",
          description: incomplete.name.trim()
            ? `El enlace "${incomplete.name.trim()}" debe ser una URL http:// o https://`
            : "Cada enlace necesita un nombre y un link http:// o https://",
          variant: "destructive",
        });
        return;
      }
    }
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      setSavingSection(section);
      const payload = buildPayload(section, actionsRef.current, savedRef.current);
      try {
        await siteSettingsService.updateQrActions(payload);
        savedRef.current = payload;
        toast({ title: "Guardado", description: saveMessages[section] });
      } catch (error) {
        toast({
          title: "Error al guardar",
          description: error instanceof Error ? error.message : "No se pudieron guardar los cambios",
          variant: "destructive",
        });
      } finally {
        setSavingSection((current) => (current === section ? null : current));
      }
    });
  };

  const toggleAction = (id: QrToggleId | "customLink", checked: boolean) => {
    setActions((current) => remember({ ...current, [id]: checked }));
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
      setActions((current) => remember({ ...current, linksBackgroundImage: url }));
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

  const handleSaveText = () => {
    enqueueSave("text");
  };

  if (!canSave) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden p-6">
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
          <div className="flex gap-2">
            <Input id="qr-link" value={QR_LINK} readOnly />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-4 w-4" />
              Vista previa
            </Button>
          </div>
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
                          <div key={option.id} className="flex min-w-0 items-center justify-between gap-4 p-4">
                            <div className="min-w-0">
                              <Label htmlFor={`qr-action-${option.id}`} className="text-base">
                                {option.title}
                              </Label>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            </div>
                            <Switch
                              id={`qr-action-${option.id}`}
                              checked={actions[option.id]}
                              disabled={!canSave }
                              onCheckedChange={(checked) => toggleAction(option.id, checked)}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button type="button" className="rounded-xl px-5" onClick={() => enqueueSave("toggles")} disabled={!canSave || savingSection !== null}>
                          {savingSection === "toggles" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Guardar
                        </Button>
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
                          Arrastra para cambiar el orden. WhatsApp siempre va primero.
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <QrCardsEditor
                        actions={actions}
                        siteLinks={siteLinks}
                        disabled={!canSave || savingSection === "links"}
                        saving={savingSection === "links"}
                        onChange={(next) => {
                          remember(next);
                          setActions(next);
                        }}
                        onPersist={() => enqueueSave("links")}
                      />
                      <div className="mt-4 flex justify-end">
                        <Button type="button" className="rounded-xl px-5" onClick={() => enqueueSave("links")} disabled={!canSave || savingSection !== null}>
                          {savingSection === "links" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Guardar
                        </Button>
                      </div>
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
                  if (!canSave  || loading || uploadingBackground) return;
                  backgroundFileRef.current?.click();
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!canSave  || loading || uploadingBackground) return;
                  setDraggingBackground(true);
                }}
                onDragLeave={() => setDraggingBackground(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDraggingBackground(false);
                  if (!canSave  || loading || uploadingBackground) return;
                  const file = event.dataTransfer.files?.[0];
                  if (file) void uploadBackground(file);
                }}
                className={`flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  draggingBackground ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                } ${!canSave  || loading || uploadingBackground ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
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
                        disabled={!canSave  || loading}
                        onClick={(event) => {
                          event.stopPropagation();
                          setActions((current) => remember({ ...current, linksBackgroundImage: "" }));
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
              disabled={!canSave  || loading}
              panelColor={actions.linksPanelColor}
              textColor={actions.linksTextColor}
              backgroundImage={actions.linksBackgroundImage}
              onUploadImage={(file) => siteSettingsService.uploadQrImage(file)}
              onChange={(linksHtml) => setActions((current) => remember({ ...current, linksHtml }))}
              onPanelColorChange={(linksPanelColor) => setActions((current) => remember({ ...current, linksPanelColor }))}
              preview={
                <div className="flex min-h-[24rem] flex-col gap-2">
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
                    <div className="relative flex min-h-[24rem] items-center justify-center px-4 py-10">
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
            <div className="flex justify-end">
              <Button type="button" className="rounded-xl px-5" onClick={handleSaveText} disabled={!canSave || loading || savingSection !== null}>
                {savingSection === "text" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <QrPagePreview open={previewOpen} onOpenChange={setPreviewOpen} actions={actions} siteLinks={siteLinks} />
    </div>
  );
};

export default ConfiguracionQr;
