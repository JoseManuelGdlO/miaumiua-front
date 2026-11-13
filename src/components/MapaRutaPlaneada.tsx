import { useEffect, useRef, useState } from "react";
import { siteSettingsService } from "@/services/siteSettingsService";
import { decodePolyline, loadMaps, mapsApi, mapsKey, pin } from "@/lib/googleMaps";

const ROSA = "#E83E8C";
const NARANJA = "#FF6300";
const geoMemo = new Map<string, Punto | null>();

type Punto = { lat: number; lng: number };
type Parada = {
  lat?: number | null;
  lng?: number | null;
  orden_entrega?: number | null;
  numero?: string | null;
  direccion?: string | null;
};
type Stop = { parada: Parada; punto: Punto; orden: number };

function puntoDe(parada: Parada): Punto | null {
  const lat = Number(parada.lat);
  const lng = Number(parada.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  if (Math.abs(lat - 24.0277) < 0.0003 && Math.abs(lng + 104.6532) < 0.0003) return null;
  return { lat, lng };
}

function geocodeDireccion(
  maps: NonNullable<ReturnType<typeof mapsApi>>,
  query: string,
  ciudad: string | null,
): Promise<Punto | null> {
  const address = `${query}${ciudad ? `, ${ciudad}` : ""}, México`;
  if (geoMemo.has(address)) return Promise.resolve(geoMemo.get(address) || null);
  if (!maps.Geocoder) return Promise.resolve(null);
  const geocoder = new maps.Geocoder();
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      const loc = results?.[0]?.geometry?.location;
      if (status !== "OK" || !loc) {
        geoMemo.set(address, null);
        return resolve(null);
      }
      const punto = puntoDe({ lat: loc.lat(), lng: loc.lng() });
      geoMemo.set(address, punto);
      resolve(punto);
    });
  });
}

type Overlay = { setMap: (m: unknown) => void };
type MapHandle = { fitBounds: (b: unknown) => void };
type LineHandle = Overlay & { setPath?: (p: Punto[]) => void };

export function MapaRutaPlaneada({
  paradas = [],
  polylineEncoded = null,
  ciudad = null,
}: {
  paradas?: Parada[];
  polylineEncoded?: string | null;
  ciudad?: string | null;
}) {
  const key = mapsKey();
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const lineRef = useRef<LineHandle | null>(null);
  const pinsRef = useRef<Overlay[]>([]);
  const sello = useRef("");
  const [apagada, setApagada] = useState(false);
  const [failed, setFailed] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [stops, setStops] = useState<Stop[]>([]);
  const clave = paradas.map((parada) => `${parada.orden_entrega}:${parada.lat},${parada.lng}:${parada.direccion || ""}`).join("|");

  useEffect(() => {
    void siteSettingsService.getPublic().then((res) => {
      setApagada(Boolean(res.data?.mapsApiApagada));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!paradas.length) {
      setStops([]);
      setBuscando(false);
      return;
    }
    let vivo = true;
    setBuscando(true);
    const ya = paradas
      .map((parada, index) => ({ parada, punto: puntoDe(parada), orden: Number(parada.orden_entrega) || index + 1 }))
      .filter((row): row is Stop => Boolean(row.punto));
    if (ya.length === paradas.length) {
      setStops(ya.sort((a, b) => a.orden - b.orden));
      setBuscando(false);
      return;
    }
    if (!key || apagada) {
      setStops(ya);
      setBuscando(false);
      return;
    }
    void loadMaps(key).then(async () => {
      const maps = mapsApi();
      if (!vivo || !maps) {
        if (vivo) {
          setStops(ya);
          setBuscando(false);
          if (!maps) setFailed(true);
        }
        return;
      }
      const rows: Stop[] = [];
      for (let index = 0; index < paradas.length; index += 1) {
        const parada = paradas[index];
        const orden = Number(parada.orden_entrega) || index + 1;
        let punto = puntoDe(parada);
        if (!punto && parada.direccion) punto = await geocodeDireccion(maps, parada.direccion, ciudad);
        if (punto) rows.push({ parada, punto, orden });
      }
      if (!vivo) return;
      setStops(rows.sort((a, b) => a.orden - b.orden));
      setBuscando(false);
    }).catch(() => {
      if (!vivo) return;
      setStops(ya);
      setBuscando(false);
      setFailed(true);
    });
    return () => {
      vivo = false;
    };
  }, [key, apagada, clave, ciudad]);

  const path = polylineEncoded ? decodePolyline(polylineEncoded) : stops.map((row) => row.punto);
  const vista = `${stops.map((row) => `${row.orden}:${row.punto.lat},${row.punto.lng}`).join("|")}|${polylineEncoded || ""}`;

  useEffect(() => {
    if (!key || apagada || stops.length === 0) return;
    let vivo = true;
    const pintar = () => {
      const el = node.current;
      if (!vivo || !el) return;
      const maps = mapsApi();
      if (!maps) {
        setFailed(true);
        return;
      }
      if (!mapRef.current || el.childElementCount === 0) {
        mapRef.current = new maps.Map(el, {
          center: stops[0].punto,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
        });
        lineRef.current = null;
      }
      const map = mapRef.current;
      for (const pinMark of pinsRef.current) pinMark.setMap(null);
      pinsRef.current = stops.map((row) => new maps.Marker({
        map,
        position: row.punto,
        icon: pin(maps, ROSA, String(row.orden)),
        title: row.parada.numero || `Parada ${row.orden}`,
        zIndex: row.orden,
      }));
      if (!lineRef.current) {
        lineRef.current = new maps.Polyline({
          map,
          path,
          strokeColor: NARANJA,
          strokeWeight: 5,
          strokeOpacity: 0.9,
        });
      } else {
        lineRef.current.setMap(map);
        lineRef.current.setPath?.(path);
      }
      if (vista !== sello.current) {
        sello.current = vista;
        const bounds = new maps.LatLngBounds();
        for (const row of stops) bounds.extend(row.punto);
        for (const punto of path) bounds.extend(punto);
        map.fitBounds(bounds);
      }
    };
    void loadMaps(key).then(() => {
      requestAnimationFrame(pintar);
    }).catch(() => {
      if (vivo) setFailed(true);
    });
    return () => {
      vivo = false;
    };
  }, [key, apagada, vista, stops.length, path.length]);

  if (!paradas.length) return null;
  if (buscando && stops.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card">
        <p className="px-3 py-2 text-xs font-medium text-muted-foreground">Ruta planeada · ubicando {paradas.length} paradas</p>
        <div className="h-64 w-full bg-muted" />
      </div>
    );
  }
  if (stops.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card">
        <p className="px-3 py-2 text-xs font-medium text-muted-foreground">Ruta planeada · sin paradas ubicadas</p>
        <div className="mx-3 mb-3 flex h-64 items-end rounded-md bg-muted p-3">
          <p className="text-sm text-foreground">Esas direcciones no se encontraron en el mapa. Comunícate a soporte para confirmarlas.</p>
        </div>
      </div>
    );
  }
  const sinMapa = apagada || !key || failed;

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <p className="px-3 py-2 text-xs font-medium text-muted-foreground">
        Ruta planeada · {stops.length} parada{stops.length === 1 ? "" : "s"}
        {stops.length !== paradas.length ? ` de ${paradas.length}` : ""}
      </p>
      {sinMapa ? (
        <div className="mx-3 mb-3 flex h-64 items-end rounded-md bg-muted p-3">
          <p className="text-sm text-foreground">
            {apagada
              ? "Google Maps está apagado. Las paradas siguen numeradas en la lista."
              : !key
                ? "Este build no trae VITE_GOOGLE_MAPS_API_KEY."
                : "Google no cargó el mapa."}
          </p>
        </div>
      ) : (
        <div ref={node} className="h-64 w-full bg-muted" />
      )}
      <p className="px-3 py-2 text-xs text-muted-foreground">
        Esta solo es una referencia de las ubicaciones y el orden que seguirían los puntos de pedidos en la ruta.
      </p>
    </div>
  );
}
