import { useEffect, useRef, useState } from "react";
import { callCenterService } from "@/services/callCenterService";
import { authService } from "@/services/authService";
import { siteSettingsService } from "@/services/siteSettingsService";
import { config } from "@/config/environment";
import { callCenterSocketUrl, loadMaps, mapsApi, pin } from "@/lib/googleMaps";
import { destPedido, pedirRutaCalles, selloRuta, splitRuta } from "@/lib/rutaCalles";

const ROSA = "#E83E8C";
const NARANJA = "#FF6300";
const GRIS = "#C4C4C4";

type Punto = { lat: number; lng: number };
type ParadaVista = {
  id?: number;
  ruta_id?: number | null;
  lat?: number | null;
  lng?: number | null;
  estado_entrega?: string;
  estado?: string;
  orden_entrega?: number | null;
  numero_pedido?: string | null;
  direccion?: string | null;
};

const geoMemo = new Map<string, Punto>();

function gpsValido(punto: Punto | null | undefined): Punto | null {
  if (!punto) return null;
  const lat = Number(punto.lat);
  const lng = Number(punto.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
}

function ordenadas(paradas: ParadaVista[]) {
  return [...paradas].sort((a, b) => (Number(a.orden_entrega) || 0) - (Number(b.orden_entrega) || 0));
}

function destinoActual(paradas: ParadaVista[], destinoId?: number | null) {
  const rows = ordenadas(paradas);
  if (destinoId != null) {
    const hit = rows.find((parada) => Number(parada.id) === Number(destinoId));
    if (hit) return hit;
  }
  return rows.find((parada) => (parada.estado_entrega || parada.estado) === "en_camino")
    || rows.find((parada) => (parada.estado_entrega || parada.estado) === "pendiente")
    || rows[0]
    || null;
}

function geocodeDireccion(
  maps: NonNullable<ReturnType<typeof mapsApi>>,
  query: string,
  ciudad: string | null,
): Promise<Punto | null> {
  const address = `${query}${ciudad ? `, ${ciudad}` : ""}, México`;
  const hit = geoMemo.get(address);
  if (hit) return Promise.resolve(hit);
  if (!maps.Geocoder) return Promise.resolve(null);
  const geocoder = new maps.Geocoder();
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      const loc = results?.[0]?.geometry?.location;
      if (status !== "OK" || !loc) return resolve(null);
      const punto = { lat: loc.lat(), lng: loc.lng() };
      geoMemo.set(address, punto);
      resolve(punto);
    });
  });
}

type Overlay = { setMap: (m: unknown) => void };
type MapHandle = { fitBounds: (b: unknown) => void; setCenter: (p: Punto) => void };
type LineHandle = Overlay & { setPath?: (p: Punto[]) => void };
type PinHandle = Overlay & { setPosition?: (p: Punto) => void };

export function MapaRutaEnVivo({
  rutaId,
  paradas = [],
  ciudad = null,
  destinoId = null,
  repartidorId = null,
  gps: gpsProp = null,
}: {
  rutaId: number | null;
  paradas?: ParadaVista[];
  ciudad?: string | null;
  destinoId?: number | null;
  repartidorId?: number | null;
  gps?: Punto | null;
}) {
  const key = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const hechoRef = useRef<LineHandle | null>(null);
  const faltaRef = useRef<LineHandle | null>(null);
  const destRef = useRef<PinHandle | null>(null);
  const driverRef = useRef<PinHandle | null>(null);
  const gpsRef = useRef<Punto | null>(gpsValido(gpsProp));
  const dirStamp = useRef("");
  const selloVista = useRef("");
  const [apagada, setApagada] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dest, setDest] = useState<Punto | null>(null);
  const [gpsRuta, setGpsRuta] = useState<Punto | null>(gpsValido(gpsProp));
  const [preview, setPreview] = useState<Punto[]>([]);

  const actual = destinoActual(paradas, destinoId);

  const aplicarGps = (punto: Punto | null) => {
    const valid = gpsValido(punto);
    if (!valid) return;
    gpsRef.current = valid;
    driverRef.current?.setPosition?.(valid);
    setGpsRuta((prev) => (prev && prev.lat === valid.lat && prev.lng === valid.lng ? prev : valid));
  };

  useEffect(() => {
    void siteSettingsService.getPublic().then((res) => {
      setApagada(Boolean(res.data?.mapsApiApagada));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    aplicarGps(gpsProp);
  }, [gpsProp?.lat, gpsProp?.lng]);

  useEffect(() => {
    if (!paradas.length || !key || apagada) return;
    let vivo = true;
    void loadMaps(key).then(async () => {
      if (!vivo) return;
      const maps = mapsApi();
      if (!maps) {
        setFailed(true);
        return;
      }
      const parada = destinoActual(paradas, destinoId);
      const query = parada?.direccion?.trim();
      const casa = query ? await geocodeDireccion(maps, query, ciudad) : null;
      if (!vivo) return;
      setDest(casa);
      const live = destPedido(gpsRef.current?.lat, gpsRef.current?.lng, casa);
      const guardado = destPedido(parada?.lat, parada?.lng, casa);
      aplicarGps(live || guardado || gpsRef.current);
    }).catch(() => {
      if (vivo) setFailed(true);
    });
    return () => {
      vivo = false;
    };
  }, [key, apagada, ciudad, destinoId, paradas.length, actual?.id, actual?.direccion]);

  useEffect(() => {
    let alive = true;
    const leerGps = () => {
      if (rutaId != null) {
        void callCenterService.trazado(rutaId).then((data) => {
          if (alive) aplicarGps({ lat: data.repartidor.lat ?? 0, lng: data.repartidor.lng ?? 0 });
        }).catch(() => {});
        return;
      }
      if (repartidorId == null) return;
      void callCenterService.listarVelocidad().then((rows) => {
        const row = rows.find((item) => Number(item.repartidor_id) === Number(repartidorId));
        if (alive) aplicarGps({ lat: row?.lat ?? 0, lng: row?.lng ?? 0 });
      }).catch(() => {});
    };
    leerGps();
    const timer = window.setInterval(leerGps, 8000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [rutaId, repartidorId]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token || repartidorId == null) return;
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
        if (Number(data.repartidorId) !== Number(repartidorId)) return;
        aplicarGps({ lat: Number(data.lat), lng: Number(data.lng) });
      };
      ws.onclose = () => {
        if (!stopped) window.setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      stopped = true;
      ws?.close();
    };
  }, [repartidorId]);

  useEffect(() => {
    const gps = gpsRef.current || gpsRuta;
    if (!gps || !dest || !destPedido(gps.lat, gps.lng, dest)) {
      dirStamp.current = "";
      if (preview.length) setPreview([]);
      return;
    }
    const stamp = selloRuta(gps, dest);
    if (stamp === dirStamp.current) return;
    dirStamp.current = stamp;
    const fallback = [gps, dest];
    setPreview(fallback);
    void pedirRutaCalles(gps, dest).then((path) => {
      if (dirStamp.current === stamp && path.length > 2) setPreview(path);
    }).catch(() => {});
  }, [gpsRuta?.lat, gpsRuta?.lng, dest?.lat, dest?.lng]);

  useEffect(() => {
    const gps = gpsRef.current || gpsRuta;
    const centro = dest || gps;
    if (apagada || !key || !node.current || !centro) return;
    void loadMaps(key).then(() => {
      if (!node.current) return;
      const maps = mapsApi();
      if (!maps) {
        setFailed(true);
        return;
      }
      if (!mapRef.current) {
        mapRef.current = new maps.Map(node.current, {
          center: centro,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
        });
      }
      const map = mapRef.current;
      const naranja = preview.length >= 2 ? preview : [];
      const { hecho, falta } = splitRuta(naranja, gps);
      if (!hechoRef.current) {
        hechoRef.current = new maps.Polyline({ path: hecho, strokeColor: GRIS, strokeWeight: 6, strokeOpacity: 1, map });
      } else {
        hechoRef.current.setMap(map);
        hechoRef.current.setPath?.(hecho);
      }
      if (!faltaRef.current) {
        faltaRef.current = new maps.Polyline({
          path: falta.length ? falta : naranja,
          strokeColor: NARANJA,
          strokeWeight: 6,
          strokeOpacity: 1,
          map,
        });
      } else {
        faltaRef.current.setMap(map);
        faltaRef.current.setPath?.(falta.length ? falta : naranja);
      }
      if (dest) {
        if (destRef.current) {
          destRef.current.setPosition?.(dest);
          destRef.current.setMap(map);
        } else {
          destRef.current = new maps.Marker({
            map,
            position: dest,
            icon: pin(maps, ROSA, "D"),
            title: actual?.numero_pedido || "Destino",
            zIndex: 2,
          });
        }
      } else {
        destRef.current?.setMap(null);
      }
      if (gps) {
        if (driverRef.current) {
          driverRef.current.setPosition?.(gps);
          driverRef.current.setMap(map);
        } else {
          driverRef.current = new maps.Marker({
            map,
            position: gps,
            icon: pin(maps, NARANJA, "R"),
            title: "Repartidor",
            zIndex: 999,
          });
        }
      } else {
        driverRef.current?.setMap(null);
      }
      const vista = `${dest?.lat ?? ""},${dest?.lng ?? ""}|${gps?.lat ?? ""},${gps?.lng ?? ""}|${naranja.length}`;
      if (vista !== selloVista.current) {
        selloVista.current = vista;
        const bounds = new maps.LatLngBounds();
        if (dest) bounds.extend(dest);
        if (gps) bounds.extend(gps);
        for (const punto of naranja) bounds.extend(punto);
        map.fitBounds(bounds);
      }
    }).catch(() => setFailed(true));
  }, [key, apagada, dest?.lat, dest?.lng, preview.length, gpsRuta?.lat, gpsRuta?.lng]);

  const etiqueta = actual?.numero_pedido
    ? `Ruta al pedido ${actual.numero_pedido}`
    : dest
      ? "Ruta al pedido actual"
      : "Sin domicilio para trazar la ruta";
  const pinHref = dest
    ? `https://www.google.com/maps?q=${dest.lat},${dest.lng}`
    : actual?.direccion
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(actual.direccion)}`
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
              : "Al poner VITE_GOOGLE_MAPS_API_KEY se ve aquí la ruta del repartidor al pedido actual."}
          </p>
        </div>
      ) : (
        <div ref={node} className="h-80 w-full bg-muted" />
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
        <a className="font-semibold text-primary" href={pinHref} target="_blank" rel="noreferrer">
          Ver ubicación
        </a>
        {gpsRuta ? <span>Repartidor en ruta</span> : <span>Sin GPS del repartidor todavía</span>}
      </div>
    </div>
  );
}
