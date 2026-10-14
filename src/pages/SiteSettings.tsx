import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Camera, Copy, Globe, Link2, Loader2, Music, Play, Save, Share2, ShoppingBag, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { canConfigureSystem } from "@/utils/permissions";
import { siteSettingsService } from "@/services/siteSettingsService";

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function extractYoutubeId(value: string) {
  const input = value.trim();
  if (!input) return null;
  if (YOUTUBE_ID.test(input)) return input;
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return YOUTUBE_ID.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && YOUTUBE_ID.test(fromQuery)) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      const marker = parts.findIndex((part) => part === "embed" || part === "shorts" || part === "live");
      const id = marker >= 0 ? parts[marker + 1] ?? "" : "";
      return YOUTUBE_ID.test(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const SiteSettings = () => {
  const { toast } = useToast();
  const [videoInput, setVideoInput] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [mercadolibreUrl, setMercadolibreUrl] = useState("");
  const [maintenancePlaceholder, setMaintenancePlaceholder] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingVideo, setSavingVideo] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await siteSettingsService.getPublic();
        if (!cancelled && res.success && res.data) {
          const d = res.data;
          if (d.heroYoutubeVideoId) setVideoInput(d.heroYoutubeVideoId);
          setInstagramUrl(d.socialInstagramUrl ?? "");
          setFacebookUrl(d.socialFacebookUrl ?? "");
          setTiktokUrl(d.socialTiktokUrl ?? "");
          setMercadolibreUrl(d.mercadolibreUrl ?? "");
          setMaintenancePlaceholder(d.maintenancePlaceholder !== false);
        }
      } catch (e) {
        if (!cancelled) {
          toast({
            title: "Error",
            description:
              e instanceof Error ? e.message : "No se pudo cargar la configuración",
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
  }, []);

  const handleMaintenanceChange = async (enabled: boolean) => {
    const previous = maintenancePlaceholder;
    setMaintenancePlaceholder(enabled);
    try {
      setSavingMaintenance(true);
      const res = await siteSettingsService.updateMaintenancePlaceholder(enabled);
      if (res.success && res.data) {
        setMaintenancePlaceholder(res.data.maintenancePlaceholder !== false);
      }
      toast({
        title: "Guardado",
        description: res.message ?? (enabled
          ? "La página principal muestra el aviso"
          : "La página principal muestra el sitio normal"),
      });
    } catch (err) {
      setMaintenancePlaceholder(previous);
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoInput.trim()) {
      toast({
        title: "Campo requerido",
        description: "Indica el ID o el enlace del video de YouTube",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingVideo(true);
      const res = await siteSettingsService.updateHeroYoutubeVideoId(videoInput.trim());
      if (res.success && res.data?.heroYoutubeVideoId) {
        setVideoInput(res.data.heroYoutubeVideoId);
      }
      toast({
        title: "Guardado",
        description: res.message ?? "Video del hero actualizado",
      });
    } catch (err) {
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setSavingVideo(false);
    }
  };

  const copyVideoInput = async () => {
    const value = videoInput.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copiado", description: "El ID o enlace quedó en el portapapeles" });
    } catch {
      toast({
        title: "No se pudo copiar",
        description: "Copia el texto manualmente",
        variant: "destructive",
      });
    }
  };

  const handleSubmitLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingLinks(true);
      const res = await siteSettingsService.updatePublicLinks({
        socialInstagramUrl: instagramUrl.trim(),
        socialFacebookUrl: facebookUrl.trim(),
        socialTiktokUrl: tiktokUrl.trim(),
        mercadolibreUrl: mercadolibreUrl.trim(),
      });
      if (res.success && res.data) {
        setInstagramUrl(res.data.socialInstagramUrl ?? "");
        setFacebookUrl(res.data.socialFacebookUrl ?? "");
        setTiktokUrl(res.data.socialTiktokUrl ?? "");
        setMercadolibreUrl(res.data.mercadolibreUrl ?? "");
      }
      toast({
        title: "Guardado",
        description: res.message ?? "Enlaces actualizados",
      });
    } catch (err) {
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setSavingLinks(false);
    }
  };

  const youtubeId = extractYoutubeId(videoInput);
  const activeChannels = [instagramUrl, facebookUrl, tiktokUrl, mercadolibreUrl].filter((value) => value.trim()).length;

  if (!canConfigureSystem()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-6xl space-y-6 p-6">
      <div className="mb-2 flex items-center gap-3">
        <Globe className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sitio web público</h1>
          <p className="text-sm text-muted-foreground">
            Contenido mostrado en la página principal (hero) y pie de página
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
                  <Wrench className="h-5 w-5 text-primary" />
                  Estamos trabajando en la aplicación
                </h2>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                    Modo global
                  </span>
                </div>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Actívalo para mostrar el aviso en la página principal. Apágalo para mostrar el sitio normal.
                </p>
              </div>
            <div className="flex shrink-0 items-center gap-3 sm:pl-4">
              <Label htmlFor="maintenance-placeholder" className="text-sm font-medium">Mostrar el aviso</Label>
              <Switch
                id="maintenance-placeholder"
                checked={maintenancePlaceholder}
                disabled={savingMaintenance}
                onCheckedChange={handleMaintenanceChange}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex h-full flex-col rounded-xl">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base leading-tight">
                  <Play className="h-5 w-5 text-primary" />
                  Video de fondo (YouTube)
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Hero background loop</p>
              </div>
              {youtubeId ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  ID válido
                </span>
              ) : null}
            </div>
            <CardDescription>
              Pega el ID del video (11 caracteres) o un enlace de YouTube (
              <span className="text-primary">youtube.com/watch?v=...</span>,{" "}
              <span className="text-primary">youtu.be/...</span>). La web construye el embed con
              reproducción automática en silencio como hasta ahora.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando…
              </div>
            ) : (
              <form onSubmit={handleSubmitVideo} className="flex flex-1 flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero-youtube">ID o enlace de YouTube</Label>
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="hero-youtube"
                      value={videoInput}
                      onChange={(e) => setVideoInput(e.target.value)}
                      placeholder="Ej. h3u-4RAwZSA o https://www.youtube.com/watch?v=..."
                      autoComplete="off"
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => void copyVideoInput()}
                      disabled={!videoInput.trim()}
                      aria-label="Copiar ID o enlace"
                      className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {youtubeId ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Vista previa configurada:{" "}
                      <span className="break-all text-foreground">https://www.youtube.com/embed/{youtubeId}</span>
                    </p>
                    <div className="relative overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                        alt="Vista previa del video de fondo"
                        className="aspect-video w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-3 flex justify-center px-3">
                        <span className="rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                          Loop silencioso habilitado (00:30s)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="mt-auto flex justify-end pt-2">
                  <Button type="submit" disabled={savingVideo} className="rounded-xl px-5">
                    {savingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar video
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col rounded-xl">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base leading-tight">
                  <Share2 className="h-5 w-5 text-primary" />
                  Redes sociales y Mercado Libre
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Canales públicos & tienda</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Canales activos: <span className="text-foreground">{activeChannels}</span>
              </span>
            </div>
            <CardDescription>
              Enlaces mostrados en el pie de página (Instagram, Facebook, TikTok) y botón para comprar
              en Mercado Libre en la página principal. Deja vacío lo que no quieras mostrar. Las URLs
              deben empezar con <span className="text-primary">https://</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando…
              </div>
            ) : (
              <form onSubmit={handleSubmitLinks} className="flex flex-1 flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social-instagram">Instagram</Label>
                  <div className="relative">
                    <Camera className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="social-instagram"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/..."
                      autoComplete="off"
                      type="url"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-facebook">Facebook</Label>
                  <div className="relative">
                    <FacebookIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="social-facebook"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/..."
                      autoComplete="off"
                      type="url"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-tiktok">TikTok</Label>
                  <div className="relative">
                    <Music className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="social-tiktok"
                      value={tiktokUrl}
                      onChange={(e) => setTiktokUrl(e.target.value)}
                      placeholder="https://www.tiktok.com/@..."
                      autoComplete="off"
                      type="url"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mercadolibre">Mercado Libre (tienda o publicación)</Label>
                  <div className="relative">
                    <ShoppingBag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="mercadolibre"
                      value={mercadolibreUrl}
                      onChange={(e) => setMercadolibreUrl(e.target.value)}
                      placeholder="https://www.mercadolibre.com.mx/..."
                      autoComplete="off"
                      type="url"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="mt-auto flex justify-end pt-2">
                  <Button type="submit" disabled={savingLinks} className="rounded-xl px-5">
                    {savingLinks ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar enlaces
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SiteSettings;
