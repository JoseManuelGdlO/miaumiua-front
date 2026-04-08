import { config } from '@/config/environment';

export interface PublicSiteSettingsData {
  heroYoutubeVideoId: string;
}

export interface UpdateHeroVideoResponse {
  success: boolean;
  data: PublicSiteSettingsData;
  message?: string;
}

class SiteSettingsService {
  async getPublic(): Promise<{ success: boolean; data: PublicSiteSettingsData }> {
    const res = await fetch(`${config.apiBaseUrl}/public/site-settings`);
    if (!res.ok) {
      throw new Error(`Error ${res.status}: no se pudo cargar la configuración del sitio`);
    }
    return res.json();
  }

  async updateHeroYoutubeVideoId(videoId: string): Promise<UpdateHeroVideoResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Token de acceso requerido');
    }

    const res = await fetch(`${config.apiBaseUrl}/site-settings/hero-youtube-video-id`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ videoId }),
    });

    if (!res.ok) {
      const { authService } = await import('./authService');
      authService.handleAuthError(res);

      let message = `Error ${res.status}`;
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    return res.json();
  }
}

export const siteSettingsService = new SiteSettingsService();
