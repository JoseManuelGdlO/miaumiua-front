import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, XCircle, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ErrorDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: {
    id: number;
    customer: string;
    errorDetails?: string;
    failureReason?: string;
    errorCode?: string;
    escalationReason?: string;
    timestamp: string;
    status: string;
  };
}

const ErrorDetailsModal = ({ open, onOpenChange, conversation }: ErrorDetailsModalProps) => {
  const { toast } = useToast();

  const copyErrorDetails = () => {
    const errorInfo = `
Error en Conversación ID: ${conversation.id}
Cliente: ${conversation.customer}
Timestamp: ${conversation.timestamp}
Estado: ${conversation.status}
${conversation.errorCode ? `Código de Error: ${conversation.errorCode}` : ''}
${conversation.failureReason ? `Razón del Fallo: ${conversation.failureReason}` : ''}
${conversation.escalationReason ? `Razón de Escalación: ${conversation.escalationReason}` : ''}
${conversation.errorDetails ? `Detalles Técnicos: ${conversation.errorDetails}` : ''}
    `.trim();

    navigator.clipboard.writeText(errorInfo);
    toast({
      title: "Copiado",
      description: "Detalles del error copiados al portapapeles"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {conversation.status === 'error' ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            )}
            Detalles del {conversation.status === 'error' ? 'Error' : 'Problema'}
          </DialogTitle>
          <DialogDescription>
            Información detallada sobre el problema en la conversación con {conversation.customer}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Status and Basic Info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estado actual</p>
                <Badge variant={conversation.status === 'error' ? 'destructive' : 'secondary'}>
                  {conversation.status === 'error' ? 'Error Crítico' : 'Escalado'}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">ID de Conversación</p>
                <p className="font-mono text-sm">{conversation.id}</p>
              </div>
            </div>

            <Separator />

            {/* Error Code */}
            {conversation.errorCode && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Código de Error:</strong> {conversation.errorCode}
                </AlertDescription>
              </Alert>
            )}

            {/* Failure Reason */}
            {conversation.failureReason && (
              <div>
                <h4 className="text-sm font-medium mb-2">Razón del Fallo</h4>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{conversation.failureReason}</p>
                </div>
              </div>
            )}

            {/* Escalation Reason */}
            {conversation.escalationReason && (
              <div>
                <h4 className="text-sm font-medium mb-2">Razón de la Escalación</h4>
                <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-md border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-800 dark:text-orange-200">{conversation.escalationReason}</p>
                </div>
              </div>
            )}

            {/* Technical Details */}
            {conversation.errorDetails && (
              <div>
                <h4 className="text-sm font-medium mb-2">Detalles Técnicos</h4>
                <div className="bg-destructive/5 p-3 rounded-md border border-destructive/20">
                  <pre className="text-xs text-destructive whitespace-pre-wrap font-mono">
                    {conversation.errorDetails}
                  </pre>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div>
              <h4 className="text-sm font-medium mb-2">Información Temporal</h4>
              <p className="text-sm text-muted-foreground">
                Ocurrió: {conversation.timestamp}
              </p>
            </div>

            {/* Actions */}
            <Separator />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyErrorDetails}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Detalles
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Conversación Completa
              </Button>
              
              {conversation.status === 'error' && (
                <Button 
                  size="sm"
                  className="flex-1"
                >
                  Reintentar Procesamiento
                </Button>
              )}
              
              {conversation.status === 'escalado' && (
                <Button 
                  size="sm"
                  className="flex-1"
                >
                  Asignar Agente Humano
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorDetailsModal;