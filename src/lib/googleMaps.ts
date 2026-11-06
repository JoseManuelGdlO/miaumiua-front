type MapsWindow = Window & {
  google?: {
    maps: {
      Map: new (el: HTMLElement, opts: Record<string, unknown>) => {
        fitBounds: (b: unknown) => void;
        setCenter: (p: { lat: number; lng: number }) => void;
      };
      Marker: new (opts: Record<string, unknown>) => {
        setMap: (m: unknown) => void;
        setPosition?: (p: { lat: number; lng: number }) => void;
      };
      Polyline: new (opts: Record<string, unknown>) => {
        setMap: (m: unknown) => void;
        setPath?: (p: { lat: number; lng: number }[]) => void;
      };
      LatLngBounds: new () => { extend: (p: { lat: number; lng: number }) => void };
      Size: new (w: number, h: number) => unknown;
      Point: new (x: number, y: number) => unknown;
    };
  };
};

let mapsPromise: Promise<void> | null = null;

export function loadMaps(key: string) {
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

export function mapsApi() {
  return (window as MapsWindow).google?.maps ?? null;
}

export function callCenterSocketUrl(apiBaseUrl: string) {
  const base = String(apiBaseUrl || "").replace(/\/$/, "");
  const wsBase = base.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  if (wsBase.endsWith("/api")) return `${wsBase}/call-center/ws`;
  return `${wsBase}/api/call-center/ws`;
}

export function pin(maps: NonNullable<ReturnType<typeof mapsApi>>, fill: string, label: string, ink = "#FFFFFF") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="12" fill="${fill}" stroke="#111111" stroke-width="2"/><text x="14" y="18" text-anchor="middle" font-size="11" font-family="sans-serif" font-weight="700" fill="${ink}">${label}</text></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(28, 28),
    anchor: new maps.Point(14, 14),
  };
}
