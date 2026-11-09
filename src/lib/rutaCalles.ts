type Punto = { lat: number; lng: number };

const memo = new Map<string, Punto[]>();

export function destPedido(lat: number | null | undefined, lng: number | null | undefined, here: Punto | null) {
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b) || (a === 0 && b === 0)) return null;
  const punto = { lat: a, lng: b };
  if (!here) return punto;
  const rad = Math.PI / 180;
  const dLat = (here.lat - a) * rad;
  const dLng = (here.lng - b) * rad;
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(a * rad) * Math.cos(here.lat * rad) * Math.sin(dLng / 2) ** 2;
  // shortcut: <80 m del GPS es el repartidor, no el domicilio
  if (6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) < 80) return null;
  return punto;
}

export function selloRuta(origen: Punto, destino: Punto) {
  return `${origen.lat.toFixed(3)},${origen.lng.toFixed(3)}>${destino.lat.toFixed(5)},${destino.lng.toFixed(5)}`;
}

export function rutaDeCalles(path: Punto[] | undefined) {
  return Array.isArray(path) && path.length > 2 ? path : [];
}

export function splitRuta(path: Punto[] | undefined, here: Punto | null) {
  const linea = Array.isArray(path) ? path.filter((punto) => Number.isFinite(punto?.lat) && Number.isFinite(punto?.lng)) : [];
  if (!linea.length) return { hecho: [] as Punto[], falta: [] as Punto[] };
  if (!here) return { hecho: [] as Punto[], falta: linea };
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < linea.length; i += 1) {
    const d = (linea[i].lat - here.lat) ** 2 + (linea[i].lng - here.lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return {
    hecho: linea.slice(0, best + 1),
    falta: [here, ...linea.slice(best + 1)],
  };
}

export async function pedirRutaCalles(origen: Punto, destino: Punto, httpGet: typeof fetch = fetch) {
  const sello = selloRuta(origen, destino);
  const hit = memo.get(sello);
  if (hit?.length) return hit;
  const url = `https://router.project-osrm.org/route/v1/driving/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`;
  const res = await httpGet(url);
  const data = await res.json() as { routes?: Array<{ geometry?: { coordinates?: number[][] } }> };
  const path: Punto[] = [];
  for (const pair of data?.routes?.[0]?.geometry?.coordinates || []) {
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const lng = Number(pair[0]);
    const lat = Number(pair[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) path.push({ lat, lng });
  }
  if (path.length > 2) memo.set(sello, path);
  return path.length > 2 ? path : [];
}
