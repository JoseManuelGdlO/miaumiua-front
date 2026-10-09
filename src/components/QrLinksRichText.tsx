import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
  Strikethrough,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { siteSettingsService } from "@/services/siteSettingsService";

interface QrLinksRichTextProps {
  value: string;
  disabled?: boolean;
  onChange: (html: string) => void;
}

const FONT_OPTIONS = [
  { label: "Fredoka", value: "Fredoka" },
  { label: "Nunito", value: "Nunito" },
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Verdana", value: "Verdana" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Courier New", value: "Courier New" },
];

const SIZE_OPTIONS = [
  { label: "Pequeño", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Grande", value: "5" },
  { label: "Título", value: "7" },
];

const QrLinksRichText = ({ value, disabled, onChange }: QrLinksRichTextProps) => {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      selectionRef.current = range;
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

  const insertImage = async (file: File) => {
    if (disabled || uploadingImage) return;
    setUploadingImage(true);
    try {
      const url = await siteSettingsService.uploadQrImage(file);
      apply("insertImage", url);
    } catch (error) {
      toast({
        title: "No se pudo subir la foto",
        description: error instanceof Error ? error.message : "Intenta con otra imagen",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const addLink = () => {
    const url = window.prompt("Escribe el link (https://)");
    if (!url) return;
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) return;
    apply("createLink", trimmed);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
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
          <option value="">Fuente</option>
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
          <option value="">Tamaño</option>
          {SIZE_OPTIONS.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        <label className="inline-flex h-8 items-center gap-1 rounded-md border bg-background px-2 text-xs">
          Color
          <input
            type="color"
            aria-label="Color del texto"
            disabled={disabled}
            defaultValue="#1c1917"
            className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
            onMouseDown={saveSelection}
            onChange={(event) => apply("foreColor", event.target.value)}
          />
        </label>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("bold")} aria-label="Negrita">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("italic")} aria-label="Cursiva">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("underline")} aria-label="Subrayado">
          <Underline className="h-4 w-4" />
        </Button>
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
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void insertImage(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || uploadingImage}
          onMouseDown={(event) => {
            event.preventDefault();
            saveSelection();
          }}
          onClick={() => fileRef.current?.click()}
          aria-label="Insertar foto"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={addLink} aria-label="Insertar enlace">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("removeFormat")} aria-label="Quitar formato">
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="true"
        aria-label="Texto de la sección de enlaces"
        data-placeholder="Miau Miau. Elige lo que quieres ver"
        className="min-h-[40vh] w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:text-primary [&_a]:underline [&_h2]:text-3xl [&_h2]:font-black [&_h3]:text-xl [&_h3]:font-bold [&_img]:mx-auto [&_img]:my-3 [&_img]:max-h-80 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_s]:line-through [&_strike]:line-through [&_ul]:list-disc [&_ul]:pl-5"
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
      />
    </div>
  );
};

export default QrLinksRichText;
