import { config } from '@/config/environment';
import { authService } from './authService';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const VAPID_KEY_STORAGE = "miaumiau_vapid_public_key";

class PushService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = authService.getToken();

    if (!token) {
      throw new Error('Token de acceso requerido');
    }

    const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      authService.handleAuthError(response);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async fetchPushPublicKey(): Promise<string | null> {
    try {
      const response = await this.makeRequest<{ success: boolean; publicKey?: string }>(
        '/push/public-key'
      );
      return typeof response.publicKey === 'string' ? response.publicKey : null;
    } catch {
      return null;
    }
  }

  async subscribePush(subscription: PushSubscriptionPayload): Promise<void> {
    await this.makeRequest('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  }

  async unsubscribePush(endpoint: string): Promise<void> {
    await this.makeRequest('/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  }

  async ensurePushSubscription(publicKey: string): Promise<void> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("Este navegador no soporta notificaciones push");
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    const storedKey = localStorage.getItem(VAPID_KEY_STORAGE);
    if (subscription && storedKey && storedKey !== publicKey) {
      await subscription.unsubscribe();
      subscription = null;
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      throw new Error("Suscripción incompleta");
    }

    await this.subscribePush({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });

    localStorage.setItem(VAPID_KEY_STORAGE, publicKey);
  }
}

export const pushService = new PushService();

export function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
