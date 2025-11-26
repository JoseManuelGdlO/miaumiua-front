import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clientesService } from "@/services/clientesService";

interface BulkUploadCustomersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

interface UploadResult {
  created: number;
  updated: number;
  errors: Array<{ row: number; message: string }>;
  total: number;
}

export default function BulkUploadCustomersModal({
  open,
  onOpenChange,
  onUploadComplete,
}: BulkUploadCustomersModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar que sea un archivo Excel
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Por favor, selecciona un archivo Excel (.xlsx o .xls)');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await clientesService.uploadBulkClientes(file);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.success) {
        setResult(response.data);
        toast({
          title: "Carga completada",
          description: `Se procesaron ${response.data.total} registros. ${response.data.created} creados, ${response.data.updated} actualizados.${response.data.errors.length > 0 ? ` ${response.data.errors.length} errores encontrados.` : ''}`,
        });
        
        // Llamar al callback para recargar la lista (sin cerrar el modal)
        onUploadComplete();
      } else {
        setError(response.message || 'Error al procesar el archivo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el archivo');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Error al cargar el archivo',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setError(null);
      setResult(null);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await clientesService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_clientes.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Template descargado",
        description: "El template se ha descargado correctamente",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Error al descargar el template',
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Solo permitir cerrar si no está cargando
      if (!uploading && !isOpen) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Carga Masiva de Clientes</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Sube un archivo Excel con los datos de los clientes. Descarga el template para ver el formato correcto.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                ¿Cómo funciona?
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Si el cliente existe (por teléfono), se actualizará con los nuevos datos</li>
                <li>Si el cliente no existe, se creará como nuevo cliente</li>
                <li><strong>NombreCompleto es opcional:</strong> Si no se proporciona, se generará automáticamente como "Cliente [Teléfono]"</li>
                <li>Los registros con errores se reportarán sin afectar los demás</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botón para descargar template */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Descargar Template
            </Button>
          </div>

          {/* Área de carga de archivo */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              file
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            {file ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={uploading}
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary hover:underline">
                      Haz clic para seleccionar
                    </span>
                    <span className="text-muted-foreground"> o arrastra el archivo aquí</span>
                  </label>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: .xlsx, .xls
                </p>
              </div>
            )}
          </div>

          {/* Barra de progreso */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Procesando archivo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Resultados */}
          {result && (
            <Alert className={result.errors.length > 0 ? 'border-warning' : 'border-success'}>
              <div className="flex items-start gap-2">
                {result.errors.length > 0 ? (
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>
                        <strong>Total procesados:</strong> {result.total}
                      </p>
                      <p>
                        <strong>Creados:</strong> {result.created}
                      </p>
                      <p>
                        <strong>Actualizados:</strong> {result.updated}
                      </p>
                      {result.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-warning mb-2">
                            Errores encontrados ({result.errors.length}):
                          </p>
                          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 max-h-64 overflow-y-auto">
                            <ul className="list-none text-sm space-y-2">
                              {result.errors.map((error, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="font-semibold text-red-700 dark:text-red-300 min-w-[60px]">
                                    Fila {error.row}:
                                  </span>
                                  <span className="text-red-600 dark:text-red-400 flex-1">
                                    {error.message}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Revisa cada error y corrige el archivo Excel antes de volver a cargar.
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Mensaje de error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              {result ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!result && (
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Cargar Archivo
                  </>
                )}
              </Button>
            )}
            {result && (
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError(null);
                  setProgress(0);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Cargar Otro Archivo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

