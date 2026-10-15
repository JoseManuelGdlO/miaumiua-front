import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { config } from "@/config/environment";
import { authService } from "@/services/authService";
import type { BackendNotification } from "@/services/notificationsService";

export type NotificationStreamEvent =
  | { type: "notification"; payload: BackendNotification }
  | { type: "reconnect" };

type Listener = (event: NotificationStreamEvent) => void;

type NotificationStreamContextValue = {
  subscribe: (listener: Listener) => () => void;
};

const NotificationStreamContext = createContext<NotificationStreamContextValue | null>(null);

export function NotificationStreamProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef(new Set<Listener>());

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

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
      }
      opened = true;
    };

    source.addEventListener("notification", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as BackendNotification;
        listenersRef.current.forEach((listener) => listener({ type: "notification", payload }));
      } catch (error) {
        console.error("No se pudo leer la notificación en vivo", error);
      }
    });

    return () => {
      source.close();
    };
  }, []);

  const value = useMemo(() => ({ subscribe }), [subscribe]);

  return (
    <NotificationStreamContext.Provider value={value}>
      {children}
    </NotificationStreamContext.Provider>
  );
}

export function useNotificationStream() {
  return useContext(NotificationStreamContext);
}
