import { config } from '@/config/environment';

export const QR_CARD_ICONS = ['whatsapp', 'pin', 'bag', 'instagram', 'facebook', 'tiktok', 'link', 'heart', 'star', 'package'] as const;
export const QR_CARD_SIZES = ['grande', 'mediana', 'chica'] as const;
export const QR_BUILTIN_IDS = ['whatsapp', 'mercadolibre', 'instagram', 'facebook', 'tiktok'] as const;
export const QR_ORDERED_BUILTIN_IDS = ['mercadolibre', 'instagram', 'facebook', 'tiktok'] as const;

export type QrCardIcon = (typeof QR_CARD_ICONS)[number];
export type QrCardSize = (typeof QR_CARD_SIZES)[number];
export type QrBuiltinId = (typeof QR_BUILTIN_IDS)[number];

export interface QrCardStyle {
  name: string;
  description: string;
  icon: QrCardIcon;
  size: QrCardSize;
  iconBackgroundColor: string;
  cardColor: string;
  iconColor: string;
  hidden: boolean;
}

export interface QrLink extends QrCardStyle {
  id: string;
  url: string;
}

export type QrCards = Record<QrBuiltinId, QrCardStyle>;

export const QR_ICON_BACKGROUND = '#e5e5e5';
export const QR_CARD_BACKGROUND = '#ffffff';
export const QR_ICON_COLOR = '#eb4699';

const DEFAULT_CARD_PAINT = {
  iconBackgroundColor: QR_ICON_BACKGROUND,
  cardColor: QR_CARD_BACKGROUND,
  iconColor: QR_ICON_COLOR,
  hidden: false,
};

export const DEFAULT_QR_CARDS: QrCards = {
  whatsapp: { ...DEFAULT_CARD_PAINT, name: '¡Pedir por WhatsApp!', description: 'Realiza tu pedido directo en un clic.', icon: 'whatsapp', size: 'grande' },
  mercadolibre: { ...DEFAULT_CARD_PAINT, name: 'Mercado Libre', description: 'Compra con envío a todo el país.', icon: 'bag', size: 'mediana' },
  instagram: { ...DEFAULT_CARD_PAINT, name: 'Instagram', description: 'Fotos, tips y gatitos.', icon: 'instagram', size: 'chica' },
  facebook: { ...DEFAULT_CARD_PAINT, name: 'Facebook', description: 'Comunidad y avisos.', icon: 'facebook', size: 'chica' },
  tiktok: { ...DEFAULT_CARD_PAINT, name: 'TikTok', description: 'Demostraciones y videos.', icon: 'tiktok', size: 'chica' },
};

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
  cards: QrCards;
  cardOrder: string[];
  linksHtml: string;
  linksPanelColor: string;
  linksBackgroundImage: string;
  linksBubbleColor: string;
  linksBubbleTextColor: string;
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
  cards: DEFAULT_QR_CARDS,
  cardOrder: [...QR_ORDERED_BUILTIN_IDS],
  linksHtml: '',
  linksPanelColor: '#fff7ed',
  linksBackgroundImage: '',
  linksBubbleColor: '#16a34a',
  linksBubbleTextColor: '#1c1917',
  linksTextColor: '#1c1917',
};

export function isQrCardIcon(value: unknown): value is QrCardIcon {
  return typeof value === 'string' && (QR_CARD_ICONS as readonly string[]).includes(value);
}

export function isQrCardSize(value: unknown): value is QrCardSize {
  return typeof value === 'string' && (QR_CARD_SIZES as readonly string[]).includes(value);
}

export interface PublicSiteSettingsData {
  heroYoutubeVideoId: string;
  socialInstagramUrl: string;
  socialFacebookUrl: string;
  socialTiktokUrl: string;
  mercadolibreUrl: string;
  qrActions: QrActions;
  maintenancePlaceholder: boolean;
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

  async uploadQrImage(file: File): Promise<string> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Token de acceso requerido');
    }

    const formData = new FormData();
    formData.append('imagen', file);
    const res = await fetch(`${config.apiBaseUrl}/site-settings/qr-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
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

    const json = await res.json();
    const url = json?.data?.url;
    if (typeof url !== 'string' || !url) {
      throw new Error('No se recibió la dirección de la imagen');
    }
    return url;
  }

  async updateMaintenancePlaceholder(maintenancePlaceholder: boolean): Promise<UpdateHeroVideoResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Token de acceso requerido');
    }

    const res = await fetch(`${config.apiBaseUrl}/site-settings/maintenance-placeholder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ maintenancePlaceholder }),
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

function hexColor(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const raw = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const [r, g, b] = raw.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function cardColors(raw: Partial<QrCardStyle> | undefined, fallback: QrCardStyle) {
  return {
    iconBackgroundColor: hexColor(raw?.iconBackgroundColor, fallback.iconBackgroundColor),
    cardColor: hexColor(raw?.cardColor, fallback.cardColor),
    iconColor: hexColor(raw?.iconColor, fallback.iconColor),
  };
}

function normalizeCardStyle(raw: Partial<QrCardStyle> | undefined, fallback: QrCardStyle): QrCardStyle {
  const name = typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 80) : fallback.name;
  const description = typeof raw?.description === 'string' ? raw.description.trim().slice(0, 160) : fallback.description;
  return {
    name,
    description,
    icon: isQrCardIcon(raw?.icon) ? raw.icon : fallback.icon,
    size: isQrCardSize(raw?.size) ? raw.size : fallback.size,
    hidden: raw?.hidden === true,
    ...cardColors(raw, fallback),
  };
}

function normalizeQrCards(raw: Partial<QrCards> | undefined): QrCards {
  return {
    whatsapp: normalizeCardStyle(raw?.whatsapp, DEFAULT_QR_CARDS.whatsapp),
    mercadolibre: normalizeCardStyle(raw?.mercadolibre, DEFAULT_QR_CARDS.mercadolibre),
    instagram: normalizeCardStyle(raw?.instagram, DEFAULT_QR_CARDS.instagram),
    facebook: normalizeCardStyle(raw?.facebook, DEFAULT_QR_CARDS.facebook),
    tiktok: normalizeCardStyle(raw?.tiktok, DEFAULT_QR_CARDS.tiktok),
  };
}

export function normalizeCardOrder(raw: unknown, linkIds: string[]) {
  const allowed = new Set<string>([...QR_ORDERED_BUILTIN_IDS, ...linkIds]);
  const order: string[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== 'string') continue;
      const id = item.trim();
      if (!allowed.has(id) || order.includes(id)) continue;
      order.push(id);
    }
  }
  for (const id of [...QR_ORDERED_BUILTIN_IDS, ...linkIds]) {
    if (!order.includes(id)) order.push(id);
  }
  return order;
}

function normalizeQrLinks(raw: Partial<QrActions> | undefined, saved?: QrVisualState | null): QrLink[] {
  const fromList = Array.isArray(raw?.links)
    ? raw.links.flatMap((item, index) => {
        if (!item || typeof item !== 'object') return [];
        const name = typeof item.name === 'string' ? item.name : '';
        const url = typeof item.url === 'string' ? item.url : '';
        const id = typeof item.id === 'string' && item.id.trim() ? item.id : `link-${index + 1}`;
        const stored = saved?.links?.[id];
        const source = stored && !isQrCardIcon(item.icon) ? { ...stored, ...item, id, name, url } : item;
        return [{
          id,
          name,
          url,
          description: typeof source.description === 'string' ? source.description.trim().slice(0, 160) : '',
          icon: isQrCardIcon(source.icon) ? source.icon : 'link',
          size: isQrCardSize(source.size) ? source.size : 'mediana',
          hidden: source.hidden === true,
          ...cardColors(source, { iconBackgroundColor: QR_ICON_BACKGROUND, cardColor: QR_CARD_BACKGROUND, iconColor: QR_ICON_COLOR, hidden: false, name: '', description: '', icon: 'link', size: 'mediana' }),
        }];
      })
    : [];
  if (fromList.length > 0) return fromList;
  if (raw?.customLink && typeof raw.customLinkUrl === 'string' && raw.customLinkUrl.trim()) {
    return [{
      id: 'legacy',
      name: typeof raw.customLinkLabel === 'string' && raw.customLinkLabel.trim() ? raw.customLinkLabel.trim() : 'Enlace',
      url: raw.customLinkUrl.trim(),
      description: '',
      icon: 'link',
      size: 'mediana',
      iconBackgroundColor: QR_ICON_BACKGROUND,
      cardColor: QR_CARD_BACKGROUND,
      iconColor: QR_ICON_COLOR,
      hidden: false,
    }];
  }
  return [];
}

function normalizeQrActions(raw: Partial<QrActions> | undefined): QrActions {
  const visual = readVisualState(typeof raw?.linksHtml === 'string' ? raw.linksHtml : '');
  const links = normalizeQrLinks(raw, visual.state);
  const cards = normalizeQrCards(
    raw?.cards?.whatsapp && isQrCardIcon(raw.cards.whatsapp.icon) ? raw.cards : visual.state?.cards ?? raw?.cards,
  );
  const cardOrder = Array.isArray(raw?.cardOrder) ? raw.cardOrder : visual.state?.cardOrder;
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
    links,
    cards,
    cardOrder: normalizeCardOrder(cardOrder, links.map((link) => link.id)),
    linksHtml: visual.html,
    linksPanelColor: normalizeHexColor(raw?.linksPanelColor, DEFAULT_QR_ACTIONS.linksPanelColor),
    linksBackgroundImage: normalizeHttpUrl(raw?.linksBackgroundImage),
    linksBubbleColor: normalizeHexColor(raw?.linksBubbleColor, DEFAULT_QR_ACTIONS.linksBubbleColor),
    linksBubbleTextColor: normalizeHexColor(raw?.linksBubbleTextColor, DEFAULT_QR_ACTIONS.linksBubbleTextColor),
    linksTextColor: normalizeHexColor(raw?.linksTextColor, DEFAULT_QR_ACTIONS.linksTextColor),
  };
}

function normalizeHttpUrl(value: string | undefined) {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch {
    /* ignore */
  }
  return '';
}

function normalizeHexColor(value: string | undefined, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const color = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : fallback;
}

const CARD_STATE_MARKER = 'MIAU_CARD_STATE:';

export type QrVisualState = {
  cards?: Partial<QrCards>;
  links?: Record<string, Partial<QrCardStyle>>;
  cardOrder?: string[];
};

export function readVisualState(html: string): { html: string; state: QrVisualState | null } {
  let state: QrVisualState | null = null;
  const clean = html.replace(/<div\b[^>]*>\s*MIAU_CARD_STATE:([^<]*?)\s*<\/div>/gi, (_, payload: string) => {
    try {
      const parsed = JSON.parse(decodeURIComponent(payload.trim())) as QrVisualState;
      if (parsed && typeof parsed === 'object') state = parsed;
    } catch {
      /* ignore a damaged copy */
    }
    return '';
  });
  return { html: clean, state };
}

export function withVisualState(actions: QrActions): QrActions {
  const styles: Record<string, Partial<QrCardStyle>> = {};
  for (const link of actions.links) {
    styles[link.id] = {
      description: link.description,
      icon: link.icon,
      size: link.size,
      iconBackgroundColor: link.iconBackgroundColor,
      cardColor: link.cardColor,
      iconColor: link.iconColor,
      hidden: link.hidden,
    };
  }
  const payload = encodeURIComponent(JSON.stringify({
    cards: actions.cards,
    links: styles,
    cardOrder: actions.cardOrder,
  } satisfies QrVisualState));
  const clean = readVisualState(actions.linksHtml).html;
  return {
    ...actions,
    linksHtml: `${clean}<div style="text-align:center">${CARD_STATE_MARKER}${payload}</div>`,
  };
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
