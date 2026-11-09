import { useEffect, useRef, useState } from "react";
import { callCenterService } from "@/services/callCenterService";
import { siteSettingsService } from "@/services/siteSettingsService";
import { config } from "@/config/environment";
import { callCenterSocketUrl, camioneta, loadMaps, mapsApi, pin } from "@/lib/googleMaps";
import { pedirRutaCalles, rutaDeCalles, selloRuta, splitRuta } from "@/lib/rutaCalles";

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

function puntoParada(parada: ParadaVista | null | undefined): Punto | null {
  if (!parada) return null;
  const lat = Number(parada.lat);
  const lng = Number(parada.lng);
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
  const geocoder = maps.Geocoder ? new maps.Geocoder() : null;
  if (!geocoder) return Promise.resolve(null);
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

async function resolverPunto(
  maps: NonNullable<ReturnType<typeof mapsApi>>,
  parada: ParadaVista | null,
  ciudad: string | null,
) {
  const known = puntoParada(parada);
  if (known) return known;
  const query = parada?.direccion?.trim();
  if (!query) return null;
  return geocodeDireccion(maps, query, ciudad);
}

type Overlay = { setMap: (m: unknown) => void };
type MapHandle = { fitBounds: (b: unknown) => void; setCenter: (p: Punto) => void };
type LineHandle = Overlay & { setPath?: (p: Punto[]) => void };
type PinHandle = Overlay & { setPosition?: (p: Punto) => void };

function gpsValido(punto: Punto | null | undefined): Punto | null {
  if (!punto) return null;
  const lat = Number(punto.lat);
  const lng = Number(punto.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
}

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
  const fitted = useRef(false);
  const fittedLine = useRef(false);
  const [apagada, setApagada] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dest, setDest] = useState<Punto | null>(null);
  const [gpsRuta, setGpsRuta] = useState<Punto | null>(gpsValido(gpsProp));
  const [preview, setPreview] = useState<Punto[]>([]);

  const actual = destinoActual(paradas, destinoId);

  useEffect(() => {
    void siteSettingsService.getPublic().then((res) => {
      setApagada(Boolean(res.data?.mapsApiApagada));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!paradas.length) return;
    let vivo = true;
    const aplicar = (rows: ParadaVista[]) => {
      if (!vivo || !key || apagada) return;
      void loadMaps(key).then(async () => {
        if (!vivo) return;
        const maps = mapsApi();
        if (!maps) {
          setFailed(true);
          return;
        }
        const destPunto = await resolverPunto(maps, destinoActual(rows, destinoId), ciudad);
        if (vivo) setDest(destPunto);
      }).catch(() => {
        if (vivo) setFailed(true);
      });
    };
    if (rutaId == null) {
      aplicar(paradas);
      return () => {
        vivo = false;
      };
    }
    void callCenterService.trazado(rutaId).then((data) => {
      if (!vivo) return;
      const deTrazado = gpsValido({ lat: data.repartidor.lat ?? 0, lng: data.repartidor.lng ?? 0 });
      if (deTrazado && !gpsRef.current) {
        gpsRef.current = deTrazado;
        setGpsRuta(deTrazado);
      }
      const merged = paradas.map((parada) => {
        const hit = data.paradas.find((row) => Number(row.pedido_id) === Number(parada.id));
        return hit ? { ...parada, lat: hit.lat, lng: hit.lng } : parada;
      });
      aplicar(merged);
    }).catch(() => {
      if (vivo) aplicar(paradas);
    });
    return () => {
      vivo = false;
    };
  }, [key, apagada, rutaId, ciudad, destinoId, paradas.length, actual?.id]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
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
        const punto = gpsValido({ lat: Number(data.lat), lng: Number(data.lng) });
        if (!punto) return;
        gpsRef.current = punto;
        driverRef.current?.setPosition?.(punto);
        const coarse = { lat: Number(punto.lat.toFixed(3)), lng: Number(punto.lng.toFixed(3)) };
        setGpsRuta((prev) => (prev && prev.lat === coarse.lat && prev.lng === coarse.lng ? prev : coarse));
      };
    };
    connect();
    return () => {
      stopped = true;
      ws?.close();
    };
  }, [repartidorId]);

  useEffect(() => {
    if (!gpsRuta || !dest) return;
    if (gpsRuta.lat === dest.lat && gpsRuta.lng === dest.lng) return;
    const stamp = selloRuta(gpsRuta, dest);
    if (stamp === dirStamp.current) return;
    dirStamp.current = stamp;
    void pedirRutaCalles(gpsRuta, dest).then((path) => {
      if (dirStamp.current === stamp && path.length > 2) setPreview(path);
    }).catch(() => {});
  }, [gpsRuta?.lat, gpsRuta?.lng, dest?.lat, dest?.lng]);

  useEffect(() => {
    if (apagada || !key || !node.current || !dest) return;
    let stop = false;
    void loadMaps(key).then(() => {
      if (stop || !node.current) return;
      const maps = mapsApi();
      if (!maps) {
        setFailed(true);
        return;
      }
      if (!mapRef.current) {
        mapRef.current = new maps.Map(node.current, {
          center: dest,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
        });
      }
      const map = mapRef.current;
      const gps = gpsRef.current || gpsRuta;
      const naranja = rutaDeCalles(preview);
      const { hecho, falta } = splitRuta(naranja, gps);
      if (!hechoRef.current) {
        hechoRef.current = new maps.Polyline({
          path: hecho,
          strokeColor: GRIS,
          strokeWeight: 6,
          strokeOpacity: 1,
          map,
        });
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
      if (destRef.current) {
        destRef.current.setPosition?.(dest);
        destRef.current.setMap(map);
      } else {
        destRef.current = new maps.Marker({
          map,
          position: dest,
          icon: pin(maps, ROSA, "D"),
          title: actual?.numero_pedido || "Destino",
        });
      }
      if (gps) {
        if (driverRef.current) {
          driverRef.current.setPosition?.(gps);
          driverRef.current.setMap(map);
        } else {
          driverRef.current = new maps.Marker({
            map,
            position: gps,
            icon: camioneta(maps, NARANJA),
            title: "Repartidor",
            zIndex: 999,
          });
        }
      }
      if (!fitted.current || (naranja.length > 2 && !fittedLine.current)) {
        fitted.current = true;
        if (naranja.length > 2) fittedLine.current = true;
        const bounds = new maps.LatLngBounds();
        bounds.extend(dest);
        if (gps) bounds.extend(gps);
        for (const punto of naranja) bounds.extend(punto);
        map.fitBounds(bounds);
      }
    }).catch(() => {
      if (!stop) setFailed(true);
    });
    return () => {
      stop = true;
    };
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
      ) : dest ? (
        <div ref={node} className="h-80 w-full bg-muted" />
      ) : (
        <div className="mx-4 mb-4 flex h-80 items-end rounded-lg bg-muted p-4">
          <p className="text-sm text-foreground">Buscando el domicilio del pedido actual.</p>
        </div>
      )}
      <div className="px-4 pb-3">
        <a className="text-sm font-semibold text-primary" href={pinHref} target="_blank" rel="noreferrer">
          Ver ubicación
        </a>
      </div>
    </div>
  );
}
