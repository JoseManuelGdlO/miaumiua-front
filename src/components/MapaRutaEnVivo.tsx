import { useEffect, useRef, useState } from "react";
import { callCenterService, type TrazadoRuta } from "@/services/callCenterService";

const ROSA = "#E83E8C";
const NARANJA = "#FF6300";
const GRIS = "#6B7280";
const CDMX = { lat: 19.4326, lng: -99.1332 };

type MapsWindow = Window & {
  google?: {
    maps: {
      Map: new (el: HTMLElement, opts: Record<string, unknown>) => { fitBounds: (b: unknown) => void; setCenter: (p: { lat: number; lng: number }) => void };
      Marker: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void };
      Polyline: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void };
      LatLngBounds: new () => { extend: (p: { lat: number; lng: number }) => void };
      Size: new (w: number, h: number) => unknown;
      Point: new (x: number, y: number) => unknown;
    };
  };
};

let mapsPromise: Promise<void> | null = null;

function loadMaps(key: string) {
  const current = window as MapsWindow;
  if (current.google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      mapsPromise = null;
      reject(new Error("No se pudo cargar el mapa"));
    };
    document.head.appendChild(script);
  });
  return mapsPromise;
}

function pin(maps: NonNullable<MapsWindow["google"]>["maps"], fill: string, label: string, ink = "#FFFFFF") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="12" fill="${fill}" stroke="#111111" stroke-width="2"/><text x="14" y="18" text-anchor="middle" font-size="11" font-family="sans-serif" font-weight="700" fill="${ink}">${label}</text></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(28, 28),
    anchor: new maps.Point(14, 14),
  };
}

export function MapaRutaEnVivo({ rutaId }: { rutaId: number | null }) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const node = useRef<HTMLDivElement>(null);
  const [trazado, setTrazado] = useState<TrazadoRuta | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (rutaId == null) {
      setTrazado(null);
      return;
    }
    let vivo = true;
    const load = () => {
      void callCenterService.trazado(rutaId).then((data) => {
        if (vivo) setTrazado(data);
      }).catch(() => {
        if (vivo) setTrazado(null);
      });
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      vivo = false;
      window.clearInterval(timer);
    };
  }, [rutaId]);

  useEffect(() => {
    if (!key || !node.current || !trazado) return;
    let stop = false;
    const overlays: { setMap: (m: unknown) => void }[] = [];
    void loadMaps(key).then(() => {
      if (stop || !node.current) return;
      const maps = (window as MapsWindow).google?.maps;
      if (!maps) {
        setFailed(true);
        return;
      }
      const gps = trazado.repartidor.lat != null && trazado.repartidor.lng != null
        ? { lat: trazado.repartidor.lat, lng: trazado.repartidor.lng }
        : null;
      const map = new maps.Map(node.current, {
        center: gps || trazado.paradas[0] || CDMX,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
      });
      const bounds = new maps.LatLngBounds();
      if (trazado.polyline.length > 1) {
        const line = new maps.Polyline({
          path: trazado.polyline,
          strokeColor: NARANJA,
          strokeWeight: 5,
          strokeOpacity: 0.9,
          map,
        });
        overlays.push(line);
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
        overlays.push(marker);
        bounds.extend({ lat: parada.lat, lng: parada.lng });
      }
      if (gps) {
        const driver = new maps.Marker({
          map,
          position: gps,
          icon: pin(maps, NARANJA, "R"),
          title: "Repartidor",
          zIndex: 999,
        });
        overlays.push(driver);
        bounds.extend(gps);
      }
      if (trazado.paradas.length || gps) map.fitBounds(bounds);
    }).catch(() => {
      if (!stop) setFailed(true);
    });
    return () => {
      stop = true;
      for (const overlay of overlays) overlay.setMap(null);
    };
  }, [key, trazado]);

  if (rutaId == null) {
    return <p className="rounded-xl bg-white p-4 text-sm text-muted-foreground">Sin ruta para esta franja.</p>;
  }

  const eta = trazado?.eta;
  const hayGps = trazado?.repartidor.lat != null;
  const etiqueta = eta
    ? `Próxima entrega: Pedido #${eta.numero || eta.pedido_id} · ${eta.minutos} min${eta.km != null ? ` · ${eta.km} km` : ""}`
    : hayGps
      ? "Sin próxima parada con coordenadas"
      : "Sin posición del repartidor";

  if (!key || failed) {
    const dest = trazado?.paradas.find((parada) => parada.estado_entrega === "en_camino") || trazado?.paradas[0];
    const href = dest ? `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving` : "https://www.google.com/maps";
    return (
      <div className="space-y-2 rounded-xl bg-white p-4">
        <p className="font-semibold">{etiqueta}</p>
        <p className="text-sm text-muted-foreground">El mapa embebido necesita la llave de Google Maps del navegador.</p>
        <a className="text-sm font-semibold text-primary" href={href} target="_blank" rel="noreferrer">Ver en Google Maps</a>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white">
      <p className="px-4 py-3 text-sm font-semibold">{etiqueta}</p>
      <div ref={node} className="h-80 w-full" />
      {trazado?.sin_coords.length ? (
        <p className="px-4 py-2 text-sm text-muted-foreground">{trazado.sin_coords.length} paradas sin coordenadas, no salen en el mapa.</p>
      ) : null}
    </div>
  );
}
