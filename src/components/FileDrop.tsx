import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIME = ["image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const ACCEPT = [...MIME, ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"].join(",");

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.jpe?g$/i.test(file.name);
}

function allowedFile(file: File) {
  if (!file.type || MIME.includes(file.type)) return true;
  return /\.(jpe?g|png|gif|webp|pdf)$/i.test(file.name);
}

function isPdfName(name?: string | null) {
  return Boolean(name && /\.pdf($|\?)/i.test(name));
}

type FileDropProps = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  file: File | null;
  existingUrl?: string;
  existingName?: string | null;
  onFile: (file: File | null) => void;
};

export function FileDrop({ id, label, hint, required, file, existingUrl, existingName, onFile }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const preview = file && isImageFile(file) ? URL.createObjectURL(file) : null;
  const showImage = preview || (existingUrl && !isPdfName(existingName) && !file);
  const showName = file?.name || (existingName && !preview ? existingName.split(/[/\\]/).pop() : "");
  const filled = Boolean(file || existingName);

  function take(next: File | null) {
    if (next && !allowedFile(next)) return;
    onFile(next);
  }

  return (
    <div
      className={`flex h-full min-h-[180px] flex-col rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
        over || filled
          ? "border-primary bg-primary/5"
          : required
            ? "border-primary/40 bg-primary/[0.03]"
            : "border-muted-foreground/25 hover:border-primary/50"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files?.[0] || null);
      }}
    >
      {filled ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          {showImage ? (
            <img src={preview || existingUrl} alt="" className="h-16 w-16 rounded object-cover" />
          ) : (
            <FileText className="h-8 w-8 text-primary" />
          )}
          <p className="max-w-full truncate text-sm font-medium">{showName}</p>
          <div className="flex items-center gap-2">
            <button type="button" className="text-sm text-primary hover:underline" onClick={() => inputRef.current?.click()}>
              Cambiar archivo
            </button>
            {file ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => take(null)}>
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <button type="button" className="flex flex-1 flex-col items-center justify-center gap-2 py-2" onClick={() => inputRef.current?.click()}>
          <Upload className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium">
            {label}
            {required ? <span className="text-primary"> *</span> : null}
          </span>
          {hint ? <span className="max-w-[220px] text-xs text-muted-foreground">{hint}</span> : (
            <span className="text-xs text-muted-foreground">PDF, JPG o PNG, máximo 5 MB</span>
          )}
          <span className="mt-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Examinar archivo</span>
        </button>
      )}
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => take(event.target.files?.[0] || null)}
      />
    </div>
  );
}
