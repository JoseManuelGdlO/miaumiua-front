import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Globe, Loader2, Link2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { canConfigureSystem } from "@/utils/permissions";
import { siteSettingsService } from "@/services/siteSettingsService";

const SiteSettings = () => {
  const { toast } = useToast();
  const [videoInput, setVideoInput] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [mercadolibreUrl, setMercadolibreUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingVideo, setSavingVideo] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);

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

  if (!canConfigureSystem()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-6 max-w-xl space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sitio web público</h1>
          <p className="text-muted-foreground text-sm">
            Contenido mostrado en la página principal (hero) y pie de página
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video de fondo (YouTube)</CardTitle>
          <CardDescription>
            Pega el ID del video (11 caracteres) o un enlace de YouTube (
            <code className="text-xs">youtube.com/watch?v=...</code>,{" "}
            <code className="text-xs">youtu.be/...</code>). La web construye el embed con
            reproducción automática en silencio como hasta ahora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando…
            </div>
          ) : (
            <form onSubmit={handleSubmitVideo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-youtube">ID o enlace de YouTube</Label>
                <Input
                  id="hero-youtube"
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  placeholder="Ej. h3u-4RAwZSA o https://www.youtube.com/watch?v=..."
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={savingVideo}>
                {savingVideo && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar video
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Redes sociales y Mercado Libre
          </CardTitle>
          <CardDescription>
            Enlaces mostrados en el pie de página (Instagram, Facebook, TikTok) y botón para comprar
            en Mercado Libre en la página principal. Deja vacío lo que no quieras mostrar. Las URLs
            deben empezar con <code className="text-xs">https://</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando…
            </div>
          ) : (
            <form onSubmit={handleSubmitLinks} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="social-instagram">Instagram</Label>
                <Input
                  id="social-instagram"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                  autoComplete="off"
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-facebook">Facebook</Label>
                <Input
                  id="social-facebook"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/..."
                  autoComplete="off"
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-tiktok">TikTok</Label>
                <Input
                  id="social-tiktok"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@..."
                  autoComplete="off"
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mercadolibre">Mercado Libre (tienda o publicación)</Label>
                <Input
                  id="mercadolibre"
                  value={mercadolibreUrl}
                  onChange={(e) => setMercadolibreUrl(e.target.value)}
                  placeholder="https://www.mercadolibre.com.mx/..."
                  autoComplete="off"
                  type="url"
                />
              </div>
              <Button type="submit" disabled={savingLinks}>
                {savingLinks && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar enlaces
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteSettings;
