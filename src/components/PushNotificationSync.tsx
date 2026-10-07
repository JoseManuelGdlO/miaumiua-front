import { useEffect } from "react";
import { pushService } from "@/services/pushService";
import { hasPermission } from "@/utils/permissions";

function isPushEnvironmentOk(): boolean {
  return (
    window.location.protocol === "https:" || window.location.hostname === "localhost"
  );
}

async function syncPushNotifications(publicKey: string): Promise<void> {
  if (typeof Notification === "undefined") return;
  if (!isPushEnvironmentOk()) return;

  if (Notification.permission === "default") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
  }

  if (Notification.permission === "granted") {
    await pushService.ensurePushSubscription(publicKey);
  }
}

/**
 * Sin UI propia: pide permiso al navegador y registra la suscripción push en el backend.
 */
export function PushNotificationSync() {
  const canUsePush = hasPermission("ver_notificaciones");

  useEffect(() => {
    if (!canUsePush) return;

    let cancelled = false;

    void (async () => {
      const publicKey = await pushService.fetchPushPublicKey();
      if (cancelled || !publicKey) return;

      try {
        await syncPushNotifications(publicKey);
      } catch (error) {
        console.warn("[push] sync", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canUsePush]);

  // Chrome puede exigir un gesto del usuario; el primer clic abre el diálogo nativo.
  useEffect(() => {
    if (!canUsePush) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;

    const onInteraction = () => {
      void (async () => {
        const publicKey = await pushService.fetchPushPublicKey();
        if (!publicKey) return;

        try {
          await syncPushNotifications(publicKey);
        } catch (error) {
          console.warn("[push] sync on interaction", error);
        }
      })();
    };

    document.addEventListener("click", onInteraction, { once: true });
    return () => document.removeEventListener("click", onInteraction);
  }, [canUsePush]);

  return null;
}
