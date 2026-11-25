import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { config } from "@/config/environment";
import { authService } from "@/services/authService";
import { esAvisoDeCola, notificationsService, resolveNotificationNavigationPath, type BackendNotification } from "@/services/notificationsService";

export type NotificationStreamEvent =
  | { type: "notification"; payload: BackendNotification }
  | { type: "reconnect" };

type Listener = (event: NotificationStreamEvent) => void;

export type ColaAviso = { id: string; origen: string; ruta: string };

function rutaDeAviso(tipo: string | undefined, id: string | number) {
  if (tipo === "check_in") return `/dashboard/call-center?tab=checkin&solicitud=${id}`;
  if (tipo === "cierre_dia") return "/dashboard/call-center?tab=checkout";
  if (tipo === "soporte") return `/dashboard/call-center?tab=soporte&aviso=${id}`;
  if (tipo === "llamada_cliente") return `/dashboard/call-center?tab=despacho&aviso=${id}`;
  return "";
}

type NotificationStreamContextValue = {
  subscribe: (listener: Listener) => () => void;
  avisos: ColaAviso[];
  dismissAviso: (id: string) => void;
  dismissAvisos: (keep?: (aviso: ColaAviso) => boolean) => void;
};

function avisoDe(payload: BackendNotification): ColaAviso | null {
  const datos = payload.datos || {};
  const origen = datos.tipo;
  if (!esAvisoDeCola(origen) || !origen) return null;
  if (payload.leida || datos.estado_solicitud === "cancelada" || datos.archivada === true) return null;
  return { id: String(payload.id), origen, ruta: rutaDeAviso(origen, payload.id) };
}

const NotificationStreamContext = createContext<NotificationStreamContextValue | null>(null);

export function NotificationStreamProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef(new Set<Listener>());
  const [avisos, setAvisos] = useState<ColaAviso[]>([]);

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const refreshAvisos = useCallback(() => {
    void notificationsService.getMappedRecentNotifications(20).then((rows) => {
      setAvisos(rows.flatMap((row) => {
        const ruta = resolveNotificationNavigationPath(row) || "";
        if (row.read || !ruta.startsWith("/dashboard")) return [];
        return [{ id: row.id, origen: row.tipo || "", ruta }];
      }));
    }).catch(() => {});
  }, []);

  const dismissAviso = useCallback((id: string) => {
    setAvisos((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const dismissAvisos = useCallback((keep?: (aviso: ColaAviso) => boolean) => {
    setAvisos((prev) => (keep ? prev.filter(keep) : []));
  }, []);

  useEffect(() => {
    refreshAvisos();
  }, [refreshAvisos]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    const source = new EventSource(
      `${config.apiBaseUrl}/notificaciones/stream?token=${encodeURIComponent(token)}`
    );
    let opened = false;

    source.onopen = () => {
      if (opened) {
        listenersRef.current.forEach((listener) => listener({ type: "reconnect" }));
        refreshAvisos();
      }
      opened = true;
    };

    source.addEventListener("notification", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as BackendNotification;
        const aviso = avisoDe(payload);
        const datos = payload.datos;
        if (datos?.tipo && esAvisoDeCola(datos.tipo)) {
          setAvisos((prev) => {
            const rest = prev.filter((item) => item.id !== String(payload.id));
            return aviso ? [aviso, ...rest] : rest;
          });
        }
        listenersRef.current.forEach((listener) => listener({ type: "notification", payload }));
      } catch (error) {
        console.error("No se pudo leer la notificación en vivo", error);
      }
    });

    return () => {
      source.close();
    };
  }, [refreshAvisos]);

  const value = useMemo(
    () => ({ subscribe, avisos, dismissAviso, dismissAvisos }),
    [subscribe, avisos, dismissAviso, dismissAvisos],
  );

  return (
    <NotificationStreamContext.Provider value={value}>
      {children}
    </NotificationStreamContext.Provider>
  );
}

export function useNotificationStream() {
  return useContext(NotificationStreamContext);
}
