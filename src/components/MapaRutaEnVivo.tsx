import { useEffect, useRef, useState } from "react";
import { callCenterService, type TrazadoRuta } from "@/services/callCenterService";
import { siteSettingsService } from "@/services/siteSettingsService";
import { config } from "@/config/environment";
import { callCenterSocketUrl, loadMaps, mapsApi, pin } from "@/lib/googleMaps";

const ROSA = "#E83E8C";
const NARANJA = "#FF6300";
const GRIS = "#6B7280";
const CDMX = { lat: 19.4326, lng: -99.1332 };

type Overlay = { setMap: (m: unknown) => void };
type MapHandle = { fitBounds: (b: unknown) => void; setCenter: (p: { lat: number; lng: number }) => void };
type LineHandle = Overlay & { setPath?: (p: { lat: number; lng: number }[]) => void };
type PinHandle = Overlay & { setPosition?: (p: { lat: number; lng: number }) => void };

export function MapaRutaEnVivo({ rutaId }: { rutaId: number | null }) {
  const key = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const lineRef = useRef<LineHandle | null>(null);
  const stopsRef = useRef<Overlay[]>([]);
  const driver = useRef<PinHandle | null>(null);
  const repartidorId = useRef<number | null>(null);
  const [trazado, setTrazado] = useState<TrazadoRuta | null>(null);
  const [failed, setFailed] = useState(false);
  const [apagada, setApagada] = useState(false);
  const [gpsLive, setGpsLive] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    void siteSettingsService.getPublic().then((res) => {
      setApagada(Boolean(res.data?.mapsApiApagada));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (rutaId == null) {
      setTrazado(null);
      setGpsLive(null);
      repartidorId.current = null;
      return;
    }
    setGpsLive(null);
    let vivo = true;
    void callCenterService.trazado(rutaId).then((data) => {
      if (!vivo) return;
      setTrazado(data);
      repartidorId.current = data.repartidor.id;
    }).catch(() => {
      if (vivo) setTrazado(null);
    });
    return () => {
      vivo = false;
    };
  }, [rutaId]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    let stopped = false;
    let ws: WebSocket | null = null;
    const connect = () => {
      if (stopped) return;
      ws = new WebSocket(callCenterSocketUrl(config.apiBaseUrl));
      ws.onopen = () => {
        if (stopped) return;
        ws?.send(JSON.stringify({ type: "auth", token }));
      };
      ws.onmessage = (message) => {
        let data: { type?: string; repartidorId?: number; lat?: number; lng?: number } | null = null;
        try {
          data = JSON.parse(String(message.data));
        } catch {
          return;
        }
        if (data?.type !== "gps") return;
        if (repartidorId.current != null && Number(data.repartidorId) !== Number(repartidorId.current)) return;
        const lat = Number(data.lat);
        const lng = Number(data.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const punto = { lat, lng };
        setGpsLive(punto);
        driver.current?.setPosition?.(punto);
      };
    };
    connect();
    return () => {
      stopped = true;
      ws?.close();
    };
  }, []);

  useEffect(() => {
    if (apagada || !key || !node.current || !trazado) return;
    let stop = false;
    void loadMaps(key).then(() => {
      if (stop || !node.current) return;
      const maps = mapsApi();
      if (!maps) {
        setFailed(true);
        return;
      }
      const gps = gpsLive
        || (trazado.repartidor.lat != null && trazado.repartidor.lng != null
          ? { lat: trazado.repartidor.lat, lng: trazado.repartidor.lng }
          : null);
      if (!mapRef.current) {
        mapRef.current = new maps.Map(node.current, {
          center: gps || trazado.paradas[0] || CDMX,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
        });
      }
      const map = mapRef.current;
      if (lineRef.current) {
        if (trazado.polyline.length > 1) lineRef.current.setPath?.(trazado.polyline);
        else lineRef.current.setMap(null);
        if (trazado.polyline.length <= 1) lineRef.current = null;
      } else if (trazado.polyline.length > 1) {
        lineRef.current = new maps.Polyline({
          path: trazado.polyline,
          strokeColor: NARANJA,
          strokeWeight: 5,
          strokeOpacity: 0.9,
          map,
        });
      }
      for (const overlay of stopsRef.current) overlay.setMap(null);
      stopsRef.current = [];
      const bounds = new maps.LatLngBounds();
      if (trazado.polyline.length > 1) {
        for (const punto of trazado.polyline) bounds.extend(punto);
      }
      const actual = trazado.paradas.find((parada) => parada.estado_entrega === "en_camino")
        || trazado.paradas.find((parada) => parada.estado_entrega === "pendiente");
      for (const parada of trazado.paradas) {
        const hecho = parada.estado_entrega === "entregado" || parada.estado_entrega === "fallido";
        const esActual = actual?.pedido_id === parada.pedido_id;
        const fill = hecho ? GRIS : esActual ? ROSA : "#FFFFFF";
        const ink = fill === "#FFFFFF" ? "#111111" : "#FFFFFF";
        const marker = new maps.Marker({
          map,
          position: { lat: parada.lat, lng: parada.lng },
          icon: pin(maps, fill, String(parada.orden || ""), ink),
          title: parada.numero || "",
        });
        stopsRef.current.push(marker);
        bounds.extend({ lat: parada.lat, lng: parada.lng });
      }
      if (gps) {
        if (driver.current) {
          driver.current.setPosition?.(gps);
          driver.current.setMap(map);
        } else {
          driver.current = new maps.Marker({
            map,
            position: gps,
            icon: pin(maps, NARANJA, "R"),
            title: "Repartidor",
            zIndex: 999,
          });
        }
        bounds.extend(gps);
      }
      if (trazado.paradas.length || gps) map.fitBounds(bounds);
    }).catch(() => {
      if (!stop) setFailed(true);
    });
    return () => {
      stop = true;
    };
  }, [key, apagada, rutaId, trazado, gpsLive == null]);

  if (rutaId == null) {
    return <p className="rounded-xl bg-white p-4 text-sm text-muted-foreground">Sin ruta para esta franja.</p>;
  }

  const eta = trazado?.eta;
  const hayGps = gpsLive != null || trazado?.repartidor.lat != null;
  const etiqueta = eta
    ? `Próxima entrega: Pedido #${eta.numero || eta.pedido_id} · ${eta.minutos} min${eta.km != null ? ` · ${eta.km} km` : ""}`
    : hayGps
      ? "Sin próxima parada con coordenadas"
      : "Sin posición del repartidor";

  const dest = trazado?.paradas.find((parada) => parada.estado_entrega === "en_camino") || trazado?.paradas[0];
  const pinHref = gpsLive
    ? `https://www.google.com/maps?q=${gpsLive.lat},${gpsLive.lng}`
    : dest
      ? `https://www.google.com/maps?q=${dest.lat},${dest.lng}`
      : dest?.direccion
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.direccion)}`
        : "https://www.google.com/maps";
  const sinMapa = apagada || !key || failed;

  return (
    <div className="overflow-hidden rounded-xl bg-white">
      <p className="px-4 py-3 text-sm font-semibold">{etiqueta}</p>
      {sinMapa ? (
        <div className="mx-4 mb-4 flex h-80 items-end rounded-lg bg-muted p-4">
          <p className="text-sm text-foreground">
            {apagada
              ? "Google Maps está apagado. Abre la ubicación en Maps."
              : hayGps
                ? "Hay GPS del repartidor. Al poner VITE_GOOGLE_MAPS_API_KEY se ve el mapa aquí."
                : "Cuando el repartidor abra la app, aquí aparece su posición. El mapa se enciende con la llave de Maps."}
          </p>
        </div>
      ) : (
        <div ref={node} className="h-80 w-full bg-muted" />
      )}
      <div className="px-4 pb-3">
        <a className="text-sm font-semibold text-primary" href={pinHref} target="_blank" rel="noreferrer">
          Ver ubicación
        </a>
      </div>
      {trazado?.sin_coords.length ? (
        <p className="px-4 py-2 text-sm text-muted-foreground">{trazado.sin_coords.length} paradas sin coordenadas, no salen en el mapa.</p>
      ) : null}
    </div>
  );
}
