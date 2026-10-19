import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  PaintBucket,
  RemoveFormatting,
  Strikethrough,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QrLinksRichTextProps {
  value: string;
  disabled?: boolean;
  panelColor: string;
  textColor: string;
  backgroundImage: string;
  preview?: ReactNode;
  onPanelColorChange?: (color: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onChange: (html: string) => void;
}

function ToolbarColorButton({
  label,
  color,
  disabled,
  onPrepare,
  onChange,
  icon,
}: {
  label: string;
  color: string;
  disabled?: boolean;
  onPrepare?: () => void;
  onChange: (color: string) => void;
  icon: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const safe = /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#000000";

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        title={label}
        className="inline-flex h-9 w-9 flex-col items-center justify-center rounded-md border border-input bg-background py-1 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        onMouseDown={(event) => {
          event.preventDefault();
          onPrepare?.();
        }}
        onClick={() => inputRef.current?.click()}
      >
        {icon}
        <span className="mt-0.5 h-1 w-4 rounded-sm" style={{ backgroundColor: safe }} />
      </button>
      <input
        ref={inputRef}
        type="color"
        tabIndex={-1}
        aria-hidden
        value={safe}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => onChange(event.target.value)}
      />
    </>
  );
}

const FONT_OPTIONS = [
  { label: "Fredoka (Branding)", value: "Fredoka" },
  { label: "Nunito", value: "Nunito" },
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Verdana", value: "Verdana" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Courier New", value: "Courier New" },
];

const SIZE_OPTIONS = [
  { label: "14px", value: "2" },
  { label: "16px", value: "3" },
  { label: "24px", value: "5" },
  { label: "Tamaño 32px", value: "7" },
];

const QrLinksRichText = ({
  value,
  disabled,
  panelColor,
  textColor,
  backgroundImage,
  preview,
  onPanelColorChange,
  onUploadImage,
  onChange,
}: QrLinksRichTextProps) => {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [fontBar, setFontBar] = useState(textColor);

  useEffect(() => {
    const id = "qr-editor-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Fredoka:wght@400;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    setFontBar(textColor);
  }, [textColor]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || "";
    }
  }, [value]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const range = selectionRef.current;
    if (!range) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const apply = (command: string, argument?: string) => {
    if (disabled) return;
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, argument);
    onChange(editorRef.current?.innerHTML ?? "");
    saveSelection();
  };

  const keepSelection = () => {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection || !editor || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    if (range.collapsed && selectionRef.current && !selectionRef.current.collapsed) return;
    selectionRef.current = range.cloneRange();
  };

  const applyTextColor = (color: string) => {
    setFontBar(color);
    apply("foreColor", color);
  };

  const addLink = () => {
    const url = window.prompt("Escribe el link (https://)");
    if (!url) return;
    const trimmed = url.trim();
    if (!/^https:\/\//i.test(trimmed)) {
      toast({
        title: "Enlace no válido",
        description: "El enlace debe empezar por https://",
        variant: "destructive",
      });
      return;
    }
    apply("createLink", trimmed);
  };

  const insertImage = async (file: File) => {
    if (disabled || !onUploadImage) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo no válido",
        description: "Sube una imagen JPG, PNG, GIF o WebP",
        variant: "destructive",
      });
      return;
    }
    try {
      const url = await onUploadImage(file);
      editorRef.current?.focus();
      restoreSelection();
      const inserted = document.execCommand("insertImage", false, url);
      if (!inserted && editorRef.current) {
        const safeUrl = url.replace(/"/g, "");
        editorRef.current.insertAdjacentHTML("beforeend", `<img src="${safeUrl}" alt="">`);
      }
      onChange(editorRef.current?.innerHTML ?? "");
      saveSelection();
    } catch (error) {
      toast({
        title: "No se pudo subir la imagen",
        description: error instanceof Error ? error.message : "Intenta con otra imagen",
        variant: "destructive",
      });
    }
  };

  const hasBackgroundImage = backgroundImage.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-card p-2">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-1">
        <select
          aria-label="Fuente"
          disabled={disabled}
          defaultValue=""
          className="h-8 rounded-md border bg-background px-2 text-xs"
          onMouseDown={saveSelection}
          onChange={(event) => {
            if (!event.target.value) return;
            apply("fontName", event.target.value);
            event.target.value = "";
          }}
        >
          <option value="">Fredoka (Branding)</option>
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Tamaño"
          disabled={disabled}
          defaultValue=""
          className="h-8 rounded-md border bg-background px-2 text-xs"
          onMouseDown={saveSelection}
          onChange={(event) => {
            if (!event.target.value) return;
            apply("fontSize", event.target.value);
            event.target.value = "";
          }}
        >
          <option value="">Tamaño 32px</option>
          {SIZE_OPTIONS.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("bold")} aria-label="Negrita">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("italic")} aria-label="Cursiva">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("underline")} aria-label="Subrayado">
          <Underline className="h-4 w-4" />
        </Button>
        <ToolbarColorButton
          label="Color del texto"
          color={fontBar}
          disabled={disabled}
          onPrepare={keepSelection}
          onChange={applyTextColor}
          icon={<span className="text-[15px] font-semibold leading-none">A</span>}
        />
        <ToolbarColorButton
          label="Fondo del panel"
          color={panelColor}
          disabled={disabled || !onPanelColorChange}
          onChange={(color) => onPanelColorChange?.(color)}
          icon={<PaintBucket className="h-4 w-4" />}
        />
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("strikeThrough")} aria-label="Tachado">
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("insertUnorderedList")} aria-label="Lista">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("insertOrderedList")} aria-label="Lista numerada">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("justifyLeft")} aria-label="Alinear a la izquierda">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("justifyCenter")} aria-label="Centrar">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("justifyRight")} aria-label="Alinear a la derecha">
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("formatBlock", "h2")} aria-label="Título">
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("formatBlock", "h3")} aria-label="Subtítulo">
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("removeFormat")} aria-label="Quitar formato">
          <RemoveFormatting className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={addLink} aria-label="Insertar enlace">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !onUploadImage}
          onMouseDown={(event) => {
            event.preventDefault();
            saveSelection();
          }}
          onClick={() => imageInputRef.current?.click()}
          aria-label="Insertar imagen"
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void insertImage(file);
          }}
        />
      </div>
      </div>
      <div className="flex flex-col gap-6">
      <div className="flex min-h-[32rem] flex-col gap-2">
      <p className="text-sm font-medium">Edición</p>
      <div
        className="relative flex min-h-[32rem] min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-md border"
        style={{
          backgroundColor: panelColor,
          color: textColor,
          backgroundImage: hasBackgroundImage ? `url("${backgroundImage.replace(/"/g, "")}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {hasBackgroundImage && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: panelColor, opacity: 0.72 }}
          />
        )}
        <span className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-full bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">
          Editable
        </span>
        <div
          ref={editorRef}
          contentEditable={!disabled}
          role="textbox"
          aria-multiline="true"
          aria-label="Texto de la sección de enlaces"
          className="relative z-10 min-h-[32rem] w-full min-w-0 max-w-full flex-1 overflow-x-hidden break-words bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring [&_a]:underline [&_font[size='1']]:text-xs [&_font[size='2']]:text-sm [&_font[size='3']]:text-base [&_font[size='4']]:text-lg [&_font[size='5']]:text-2xl [&_font[size='6']]:text-4xl [&_font[size='7']]:text-5xl [&_font[size='7']]:font-black [&_h2]:text-3xl [&_h2]:font-black [&_h3]:text-xl [&_h3]:font-bold [&_img]:mx-auto [&_img]:my-3 [&_img]:max-h-80 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_s]:line-through [&_strike]:line-through [&_ul]:list-disc [&_ul]:pl-5"
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
        />
      </div>
      </div>
      {preview}
      </div>
    </div>
  );
};

export default QrLinksRichText;
