import { ArrowRight, ArrowUpRight, ChevronRight, Facebook, Heart, Instagram, Link2, MapPin, Music, Package, ShoppingBag, Star, type LucideIcon } from "lucide-react";
import type { QrCardIcon, QrCardSize } from "@/services/siteSettingsService";

export type QrDisplayCard = {
  id: string;
  name: string;
  description: string;
  icon: QrCardIcon;
  size: QrCardSize;
  iconBackgroundColor: string;
  cardColor: string;
  iconColor: string;
};

const ICONS: Record<Exclude<QrCardIcon, "whatsapp">, LucideIcon> = {
  pin: MapPin,
  bag: ShoppingBag,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music,
  link: Link2,
  heart: Heart,
  star: Star,
  package: Package,
};

const ACTION: Record<QrCardIcon, string> = {
  whatsapp: "Iniciar conversación",
  pin: "Ver más",
  bag: "Comprar",
  instagram: "Abrir Instagram",
  facebook: "Abrir Facebook",
  tiktok: "Abrir TikTok",
  link: "Abrir enlace",
  heart: "Abrir",
  star: "Abrir",
  package: "Ver paquete",
};

function Mark({ name, className }: { name: QrCardIcon; className?: string }) {
  if (name === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10.1 10.1 0 0 0 4.65 1.12h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.92c-.24.68-1.4 1.25-1.94 1.33-.5.08-1.12.11-1.81-.11-.41-.14-.95-.31-1.63-.61-2.87-1.24-4.74-4.13-4.88-4.32-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.27.64-.39.86-.39.1 0 .2 0 .29.01.24.01.36-.04.55.42.2.5.68 1.72.74 1.84.06.13.1.28.02.45-.08.17-.12.28-.24.43-.12.15-.25.33-.36.44-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.66.92.82 1.69 1.08 1.93 1.2.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.18 1.26z" />
      </svg>
    );
  }
  const Icon = ICONS[name] ?? Link2;
  return <Icon className={className} />;
}

function IconTile({ card, glyph }: { card: QrDisplayCard; glyph: string }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center" style={{ color: card.iconColor }}>
      <Mark name={card.icon} className={glyph} />
    </span>
  );
}

function Watermark({ card, className }: { card: QrDisplayCard; className: string }) {
  return (
    <span className={`pointer-events-none absolute ${className}`} style={{ color: card.iconBackgroundColor }}>
      <Mark name={card.icon} className="h-full w-full" />
    </span>
  );
}

function CardFace({ card, featured }: { card: QrDisplayCard; featured?: boolean }) {
  const action = ACTION[card.icon] ?? "Abrir";
  const surface = { backgroundColor: card.cardColor };

  if (featured) {
    return (
      <div className="relative flex min-h-[220px] w-full min-w-0 overflow-hidden rounded-3xl border border-orange-200 p-6 text-left shadow-sm transition-shadow hover:shadow-md md:p-8" style={surface}>
        <span className="absolute right-8 top-0 z-10 rounded-b-md bg-orange-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          Atención inmediata
        </span>
        <Watermark card={card} className="-bottom-6 right-6 h-44 w-44" />
        <div className="relative z-10 max-w-xl">
          <IconTile card={card} glyph="h-6 w-6" />
          <h3 className="mt-4 break-words text-3xl font-black text-neutral-950" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            {card.name}
          </h3>
          {card.description ? <p className="mt-2 break-words text-sm leading-relaxed text-neutral-500">{card.description}</p> : null}
          <div className="mt-6 inline-flex items-center gap-2 border-t border-neutral-100 pt-4 text-sm font-semibold text-orange-600">
            {action}
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  if (card.size === "chica") {
    return (
      <div className="relative flex h-full min-w-0 items-center gap-3 overflow-hidden rounded-3xl border border-neutral-200 p-4 shadow-sm transition-shadow hover:shadow-md" style={surface}>
        <Watermark card={card} className="-bottom-4 -right-3 h-16 w-16" />
        <IconTile card={card} glyph="h-5 w-5" />
        <span className="relative min-w-0 flex-1">
          <span className="block truncate text-base font-bold text-neutral-950" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            {card.name}
          </span>
          {card.description ? <span className="block truncate text-xs text-neutral-500">{card.description}</span> : null}
        </span>
        <ChevronRight className="relative h-4 w-4 shrink-0 text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-neutral-200 p-5 text-left shadow-sm transition-shadow hover:shadow-md" style={surface}>
      <Watermark card={card} className="-bottom-8 -right-6 h-36 w-36" />
      <div className="relative flex items-start justify-between gap-3">
        <IconTile card={card} glyph="h-6 w-6" />
        <ArrowUpRight className="h-4 w-4 text-neutral-400" />
      </div>
      <h3 className="relative mt-4 break-words text-xl font-black text-neutral-950" style={{ fontFamily: "'Fredoka', sans-serif" }}>
        {card.name}
      </h3>
      {card.description ? <p className="relative mt-2 break-words text-sm leading-relaxed text-neutral-500">{card.description}</p> : null}
      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3 text-sm text-neutral-500">
        <span className="font-medium">{action}</span>
        <ArrowRight className="h-4 w-4 shrink-0" />
      </div>
    </div>
  );
}

export function QrCardSizePreview({ card, featured }: { card: QrDisplayCard; featured?: boolean }) {
  if (featured) {
    return <CardFace card={card} featured />;
  }
  return (
    <div className="min-w-0">
      {card.size === "chica" ? (
        <div className="grid grid-cols-3 gap-4">
          <CardFace card={card} />
        </div>
      ) : card.size === "grande" ? (
        <CardFace card={card} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <CardFace card={card} />
        </div>
      )}
    </div>
  );
}

export default function QrLinkCardGrid({ featured, cards }: { featured: QrDisplayCard | null; cards: QrDisplayCard[] }) {
  if (!featured && cards.length === 0) return null;

  return (
    <div className="mx-auto mt-10 min-w-0 max-w-5xl text-left">
      {featured ? (
        <div className="mb-8 w-full min-w-0">
          <CardFace card={featured} featured />
        </div>
      ) : null}
      {cards.length > 0 ? (
        <div className="space-y-4">
          {cards.some((card) => card.size !== "chica") ? (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              {cards.filter((card) => card.size !== "chica").map((card) => (
                <div key={card.id} className={`min-w-0 ${card.size === "grande" ? "sm:col-span-2" : ""}`}>
                  <CardFace card={card} />
                </div>
              ))}
            </div>
          ) : null}
          {cards.some((card) => card.size === "chica") ? (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
              {cards.filter((card) => card.size === "chica").map((card) => (
                <div key={card.id} className="min-w-0">
                  <CardFace card={card} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
