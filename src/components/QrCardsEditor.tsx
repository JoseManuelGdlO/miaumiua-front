import { useRef, useState, type ReactNode } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, Facebook, GripVertical, Heart, Instagram, Link2, Loader2, MapPin, Music, Package, Pencil, Plus, ShoppingBag, Smartphone, Star, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  QR_CARD_BACKGROUND,
  QR_CARD_ICONS,
  QR_CARD_SIZES,
  QR_ICON_BACKGROUND,
  QR_ICON_COLOR,
  type QrActions,
  type QrBuiltinId,
  type QrCardIcon,
  type QrCardSize,
} from "@/services/siteSettingsService";
import { QrCardSizePreview } from "@/components/QrLinkCardGrid";

type SiteLinks = {
  mercadolibreUrl: string;
  socialInstagramUrl: string;
  socialFacebookUrl: string;
  socialTiktokUrl: string;
};

type Draft = {
  id: string;
  kind: "link" | QrBuiltinId;
  name: string;
  description: string;
  url: string;
  icon: QrCardIcon;
  size: QrCardSize;
  iconBackgroundColor: string;
  cardColor: string;
  iconColor: string;
};

const ICONS: { id: QrCardIcon; label: string; icon: LucideIcon }[] = [
  { id: "whatsapp", label: "WhatsApp", icon: Smartphone },
  { id: "pin", label: "Pin", icon: MapPin },
  { id: "bag", label: "Bolsa", icon: ShoppingBag },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "tiktok", label: "TikTok", icon: Music },
  { id: "link", label: "Enlace", icon: Link2 },
  { id: "heart", label: "Corazón", icon: Heart },
  { id: "star", label: "Estrella", icon: Star },
  { id: "package", label: "Paquete", icon: Package },
];

const SIZES: { id: QrCardSize; label: string; hint: string }[] = [
  { id: "grande", label: "Grande", hint: "Todo el ancho" },
  { id: "mediana", label: "Mediana", hint: "La mitad" },
  { id: "chica", label: "Chica", hint: "Un tercio" },
];

function ColorSquare({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#eb4699";
  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-label={label}
        title={label}
        className="inline-flex h-9 w-9 flex-col items-center justify-center rounded-md border border-input bg-background py-1"
        onClick={() => inputRef.current?.click()}
      >
        <span className="h-3.5 w-3.5 rounded-sm border" style={{ backgroundColor: safe }} />
        <span className="mt-0.5 h-1 w-4 rounded-sm" style={{ backgroundColor: safe }} />
      </button>
      <input ref={inputRef} type="color" tabIndex={-1} aria-hidden value={safe} className="sr-only" onChange={(event) => onChange(event.target.value)} />
      <span className="block max-w-[5.5rem] text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function builtinUrl(id: QrBuiltinId, siteLinks: SiteLinks) {
  if (id === "mercadolibre") return siteLinks.mercadolibreUrl;
  if (id === "instagram") return siteLinks.socialInstagramUrl;
  if (id === "facebook") return siteLinks.socialFacebookUrl;
  if (id === "tiktok") return siteLinks.socialTiktokUrl;
  return "";
}

function SortableRow({
  id,
  disabled,
  muted,
  children,
}: {
  id: string;
  disabled?: boolean;
  muted?: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex w-full min-w-0 flex-wrap items-center gap-3 overflow-hidden rounded-xl border p-3 ${muted ? "bg-muted/80" : "bg-card"}`}
    >
      <button
        type="button"
        className="cursor-grab rounded-md p-1 text-muted-foreground disabled:cursor-not-allowed"
        disabled={disabled}
        aria-label="Arrastrar para cambiar el orden"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

export default function QrCardsEditor({
  actions,
  siteLinks,
  disabled,
  saving,
  onChange,
  onPersist,
}: {
  actions: QrActions;
  siteLinks: SiteLinks;
  disabled?: boolean;
  saving?: boolean;
  onChange: (next: QrActions) => void;
  onPersist?: () => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const linksById = new Map(actions.links.map((link) => [link.id, link]));

  const openBuiltin = (id: QrBuiltinId) => {
    const card = actions.cards[id];
    setError("");
    setDraft({
      id,
      kind: id,
      name: card.name,
      description: card.description,
      url: builtinUrl(id, siteLinks),
      icon: card.icon,
      size: card.size,
      iconBackgroundColor: card.iconBackgroundColor,
      cardColor: card.cardColor,
      iconColor: card.iconColor,
    });
  };

  const openLink = (id: string) => {
    const link = linksById.get(id);
    if (!link) return;
    setError("");
    setDraft({
      id: link.id,
      kind: "link",
      name: link.name,
      description: link.description,
      url: link.url,
      icon: link.icon,
      size: link.size,
      iconBackgroundColor: link.iconBackgroundColor,
      cardColor: link.cardColor,
      iconColor: link.iconColor,
    });
  };

  const openNew = () => {
    setError("");
    setDraft({
      id: `link-${Date.now()}`,
      kind: "link",
      name: "",
      description: "",
      url: "",
      icon: "link",
      size: "mediana",
      iconBackgroundColor: QR_ICON_BACKGROUND,
      cardColor: QR_CARD_BACKGROUND,
      iconColor: QR_ICON_COLOR,
    });
  };

  const saveDraft = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setError("Escribe el nombre de la card.");
      return;
    }
    if (draft.kind === "link" && !isHttpUrl(draft.url)) {
      setError("El enlace debe ser una URL http:// o https://.");
      return;
    }
    if (draft.kind === "link") {
      const nextLink = {
        id: draft.id,
        name,
        url: draft.url.trim(),
        description: draft.description.trim(),
        icon: draft.icon,
        size: draft.size,
        iconBackgroundColor: draft.iconBackgroundColor,
        cardColor: draft.cardColor,
        iconColor: draft.iconColor,
        hidden: actions.links.find((link) => link.id === draft.id)?.hidden === true,
      };
      const exists = actions.links.some((link) => link.id === draft.id);
      onChange({
        ...actions,
        links: exists ? actions.links.map((link) => (link.id === draft.id ? nextLink : link)) : [...actions.links, nextLink],
        cardOrder: actions.cardOrder.includes(draft.id) ? actions.cardOrder : [...actions.cardOrder, draft.id],
      });
    } else {
      onChange({
        ...actions,
        cards: {
          ...actions.cards,
          [draft.kind]: {
            name,
            description: draft.description.trim(),
            icon: draft.icon,
            size: draft.size,
            iconBackgroundColor: draft.iconBackgroundColor,
            cardColor: draft.cardColor,
            iconColor: draft.iconColor,
            hidden: actions.cards[draft.kind].hidden === true,
          },
        },
      });
    }
    setDraft(null);
    onPersist?.();
  };

  const setCardHidden = (id: string, hidden: boolean) => {
    if (id === "whatsapp" || id === "mercadolibre" || id === "instagram" || id === "facebook" || id === "tiktok") {
      onChange({
        ...actions,
        cards: { ...actions.cards, [id]: { ...actions.cards[id], hidden } },
      });
      onPersist?.();
      return;
    }
    onChange({
      ...actions,
      links: actions.links.map((link) => (link.id === id ? { ...link, hidden } : link)),
    });
    onPersist?.();
  };

  const removeLink = (id: string) => {
    onChange({
      ...actions,
      links: actions.links.filter((link) => link.id !== id),
      cardOrder: actions.cardOrder.filter((item) => item !== id),
    });
    onPersist?.();
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = actions.cardOrder.indexOf(String(active.id));
    const newIndex = actions.cardOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onChange({ ...actions, cardOrder: arrayMove(actions.cardOrder, oldIndex, newIndex) });
    onPersist?.();
  };

  const rowBody = (title: string, detail: string, icon: QrCardIcon, hidden: boolean, onEdit: () => void, onToggle: () => void, onRemove?: () => void) => {
    const Icon = ICONS.find((item) => item.id === icon)?.icon ?? Link2;
    return (
      <>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${hidden ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className={`min-w-[9rem] flex-1 ${hidden ? "text-muted-foreground" : ""}`}>
          <span className="block truncate font-medium">{title || "Sin nombre"}</span>
          <span className="block truncate text-xs text-muted-foreground">{detail}</span>
          {hidden ? <span className="mt-1 inline-flex rounded-full bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Oculto</span> : null}
        </span>
        <span className="ml-auto flex shrink-0 items-center justify-end gap-2">
        <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={onEdit} aria-label={`Editar ${title || "enlace"}`} title="Editar">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={onToggle} aria-label={hidden ? `Activar ${title || "enlace"}` : `Ocultar ${title || "enlace"}`} title={hidden ? "Activar" : "Ocultar"}>
          {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        {onRemove ? (
          <Button type="button" variant="ghost" size="icon" disabled={disabled} onClick={onRemove} aria-label={`Eliminar ${title || "enlace"}`} title="Eliminar">
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
        </span>
      </>
    );
  };

  return (
    <div className="space-y-3">
      <div className={`flex w-full min-w-0 flex-wrap items-center gap-3 overflow-hidden rounded-xl border p-3 ${actions.cards.whatsapp.hidden ? "bg-muted/80" : "bg-card"}`}>
        <span className="w-6 shrink-0" />
        {rowBody(
          actions.cards.whatsapp.name,
          "Siempre va primero y separado. Abre el pedido por ciudad.",
          actions.cards.whatsapp.icon,
          actions.cards.whatsapp.hidden,
          () => openBuiltin("whatsapp"),
          () => setCardHidden("whatsapp", !actions.cards.whatsapp.hidden),
        )}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={actions.cardOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {actions.cardOrder.map((id) => {
              const link = linksById.get(id);
              if (link) {
                return (
                  <SortableRow key={id} id={id} disabled={disabled} muted={link.hidden}>
                    {rowBody(link.name, link.url || "Sin enlace", link.icon, link.hidden, () => openLink(id), () => setCardHidden(id, !link.hidden), () => setPendingDelete({ id, name: link.name }))}
                  </SortableRow>
                );
              }
              if (id === "mercadolibre" || id === "instagram" || id === "facebook" || id === "tiktok") {
                const card = actions.cards[id];
                const url = builtinUrl(id, siteLinks);
                return (
                  <SortableRow key={id} id={id} disabled={disabled} muted={card.hidden}>
                    {rowBody(card.name, url || "La URL se configura en Sitio web", card.icon, card.hidden, () => openBuiltin(id), () => setCardHidden(id, !card.hidden))}
                  </SortableRow>
                );
              }
              return null;
            })}
          </div>
        </SortableContext>
      </DndContext>
      <Button type="button" variant="outline" onClick={openNew} disabled={disabled}>
        <Plus className="h-4 w-4" />
        Añadir enlace
      </Button>
      <Dialog open={draft !== null} onOpenChange={(open) => { if (!open) setDraft(null); }}>
        <DialogContent className="max-h-[90vh] w-[min(100%-1.5rem,1100px)] max-w-[1100px] overflow-y-auto sm:max-w-[1100px]">
          <DialogHeader>
            <DialogTitle>{draft && actions.links.some((link) => link.id === draft.id) || (draft && draft.kind !== "link") ? "Editar card" : "Nueva card"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-6">
              <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-card-name">Nombre</Label>
                <Input id="qr-card-name" value={draft.name} maxLength={80} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-card-description">Descripción</Label>
                <Textarea id="qr-card-description" value={draft.description} maxLength={160} rows={3} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-card-url">Link</Label>
                {draft.kind === "link" ? (
                  <Input id="qr-card-url" value={draft.url} placeholder="https://" onChange={(event) => setDraft({ ...draft, url: event.target.value })} />
                ) : (
                  <Input id="qr-card-url" value={draft.kind === "whatsapp" ? "Abre el pedido por ciudad" : draft.url || "Se configura en Sitio web"} readOnly />
                )}
              </div>
              <div className="space-y-2">
                <Label>Icono</Label>
                <div className="grid grid-cols-5 gap-2">
                  {QR_CARD_ICONS.map((id) => {
                    const option = ICONS.find((item) => item.id === id);
                    if (!option) return null;
                    const Icon = option.icon;
                    const selected = draft.icon === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-label={option.label}
                        title={option.label}
                        onClick={() => setDraft({ ...draft, icon: id })}
                        className={`flex h-10 items-center justify-center rounded-md border ${selected ? "border-primary bg-primary/10 text-primary" : "bg-background"}`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tamaño</Label>
                <div className="grid grid-cols-3 gap-2">
                  {QR_CARD_SIZES.map((id) => {
                    const option = SIZES.find((item) => item.id === id);
                    if (!option) return null;
                    const selected = draft.size === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setDraft({ ...draft, size: id })}
                        className={`rounded-md border px-2 py-2 text-left ${selected ? "border-primary bg-primary/10" : "bg-background"}`}
                      >
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="block text-xs text-muted-foreground">{option.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Colores</Label>
                <div className="flex flex-wrap gap-4">
                  <ColorSquare label="Icono de fondo" value={draft.iconBackgroundColor} onChange={(iconBackgroundColor) => setDraft({ ...draft, iconBackgroundColor })} />
                  <ColorSquare label="Card" value={draft.cardColor} onChange={(cardColor) => setDraft({ ...draft, cardColor })} />
                  <ColorSquare label="Icono" value={draft.iconColor} onChange={(iconColor) => setDraft({ ...draft, iconColor })} />
                </div>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
              <div className="rounded-xl border bg-white p-4">
                <p className="mb-3 text-sm font-medium">Vista previa</p>
                <QrCardSizePreview
                  featured={draft.kind === "whatsapp"}
                  card={{
                    id: draft.id,
                    name: draft.name.trim() || "Nombre de la card",
                    description: draft.description.trim(),
                    icon: draft.icon,
                    size: draft.size,
                    iconBackgroundColor: draft.iconBackgroundColor,
                    cardColor: draft.cardColor,
                    iconColor: draft.iconColor,
                  }}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDraft(null)} disabled={saving}>Cancelar</Button>
            <Button type="button" onClick={saveDraft} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este enlace?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name.trim()
                ? `Se quitará «${pendingDelete.name.trim()}» y dejará de verse en la página del QR.`
                : "Se quitará este enlace y dejará de verse en la página del QR."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!pendingDelete) return;
                removeLink(pendingDelete.id);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
