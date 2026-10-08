import { config } from '@/config/environment';

export interface QrLink {
  id: string;
  name: string;
  url: string;
}

export interface QrActions {
  whatsapp: boolean;
  catalog: boolean;
  packages: boolean;
  promotions: boolean;
  mercadolibre: boolean;
  social: boolean;
  customLink: boolean;
  customLinkUrl: string;
  customLinkLabel: string;
  links: QrLink[];
  linksHtml: string;
  linksPanelColor: string;
  linksBubbleColor: string;
  linksTextColor: string;
}

export const DEFAULT_QR_ACTIONS: QrActions = {
  whatsapp: true,
  catalog: true,
  packages: true,
  promotions: true,
  mercadolibre: true,
  social: true,
  customLink: false,
  customLinkUrl: '',
  customLinkLabel: '',
  links: [],
  linksHtml: '',
  linksPanelColor: '#fff7ed',
  linksBubbleColor: '#16a34a',
  linksTextColor: '#1c1917',
};

export interface PublicSiteSettingsData {
  heroYoutubeVideoId: string;
  socialInstagramUrl: string;
  socialFacebookUrl: string;
  socialTiktokUrl: string;
  mercadolibreUrl: string;
  qrActions: QrActions;
}

export interface UpdateHeroVideoResponse {
  success: boolean;
  data: PublicSiteSettingsData;
  message?: string;
}

export interface UpdatePublicLinksBody {
  socialInstagramUrl: string;
  socialFacebookUrl: string;
  socialTiktokUrl: string;
  mercadolibreUrl: string;
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

  async updatePublicLinks(body: UpdatePublicLinksBody): Promise<UpdateHeroVideoResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Token de acceso requerido');
    }

    const res = await fetch(`${config.apiBaseUrl}/site-settings/public-links`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const { authService } = await import('./authService');
      authService.handleAuthError(res);

      let message = `Error ${res.status}`;
      try {
        const json = await res.json();
        if (json?.message) message = json.message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    return res.json();
  }

  async updateQrActions(qrActions: QrActions): Promise<UpdateHeroVideoResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Token de acceso requerido');
    }

    const res = await fetch(`${config.apiBaseUrl}/site-settings/qr-actions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ qrActions }),
    });

    if (!res.ok) {
      const { authService } = await import('./authService');
      authService.handleAuthError(res);

      let message = `Error ${res.status}`;
      try {
        const json = await res.json();
        if (json?.message) message = json.message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    return res.json();
  }
}

function normalizeQrLinks(raw: Partial<QrActions> | undefined): QrLink[] {
  const fromList = Array.isArray(raw?.links)
    ? raw.links.flatMap((item, index) => {
        if (!item || typeof item !== 'object') return [];
        const name = typeof item.name === 'string' ? item.name : '';
        const url = typeof item.url === 'string' ? item.url : '';
        const id = typeof item.id === 'string' && item.id.trim() ? item.id : `link-${index + 1}`;
        return [{ id, name, url }];
      })
    : [];
  if (fromList.length > 0) return fromList;
  if (raw?.customLink && typeof raw.customLinkUrl === 'string' && raw.customLinkUrl.trim()) {
    return [{
      id: 'legacy',
      name: typeof raw.customLinkLabel === 'string' && raw.customLinkLabel.trim() ? raw.customLinkLabel.trim() : 'Enlace',
      url: raw.customLinkUrl.trim(),
    }];
  }
  return [];
}

function normalizeQrActions(raw: Partial<QrActions> | undefined): QrActions {
  return {
    whatsapp: typeof raw?.whatsapp === 'boolean' ? raw.whatsapp : DEFAULT_QR_ACTIONS.whatsapp,
    catalog: typeof raw?.catalog === 'boolean' ? raw.catalog : DEFAULT_QR_ACTIONS.catalog,
    packages: typeof raw?.packages === 'boolean' ? raw.packages : DEFAULT_QR_ACTIONS.packages,
    promotions: typeof raw?.promotions === 'boolean' ? raw.promotions : DEFAULT_QR_ACTIONS.promotions,
    mercadolibre: typeof raw?.mercadolibre === 'boolean' ? raw.mercadolibre : DEFAULT_QR_ACTIONS.mercadolibre,
    social: typeof raw?.social === 'boolean' ? raw.social : DEFAULT_QR_ACTIONS.social,
    customLink: typeof raw?.customLink === 'boolean' ? raw.customLink : DEFAULT_QR_ACTIONS.customLink,
    customLinkUrl: typeof raw?.customLinkUrl === 'string' ? raw.customLinkUrl.trim() : '',
    customLinkLabel: typeof raw?.customLinkLabel === 'string' ? raw.customLinkLabel.trim() : '',
    links: normalizeQrLinks(raw),
    linksHtml: typeof raw?.linksHtml === 'string' ? raw.linksHtml : '',
    linksPanelColor: normalizeHexColor(raw?.linksPanelColor, DEFAULT_QR_ACTIONS.linksPanelColor),
    linksBubbleColor: normalizeHexColor(raw?.linksBubbleColor, DEFAULT_QR_ACTIONS.linksBubbleColor),
    linksTextColor: normalizeHexColor(raw?.linksTextColor, DEFAULT_QR_ACTIONS.linksTextColor),
  };
}

function normalizeHexColor(value: string | undefined, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const color = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : fallback;
}

export function normalizePublicSiteSettings(data: Partial<PublicSiteSettingsData> | undefined): PublicSiteSettingsData {
  return {
    heroYoutubeVideoId: data?.heroYoutubeVideoId ?? '',
    socialInstagramUrl: data?.socialInstagramUrl ?? '',
    socialFacebookUrl: data?.socialFacebookUrl ?? '',
    socialTiktokUrl: data?.socialTiktokUrl ?? '',
    mercadolibreUrl: data?.mercadolibreUrl ?? '',
    qrActions: normalizeQrActions(data?.qrActions),
  };
}

export const siteSettingsService = new SiteSettingsService();
