import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Mail, AlertCircle } from "lucide-react";

const DataDeletion = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Solicitud de Eliminación de Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-muted-foreground">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Derecho a la Eliminación de Datos
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                Tienes derecho a solicitar la eliminación de tus datos personales. 
                Procesaremos tu solicitud de acuerdo con las leyes de protección de datos aplicables.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">¿Qué datos se eliminan?</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Información de perfil y contacto</li>
              <li>Historial de conversaciones con el bot</li>
              <li>Pedidos y transacciones asociadas</li>
              <li>Datos de preferencias y configuraciones</li>
              <li>Otros datos personales almacenados</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Proceso de Eliminación</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Envía una solicitud de eliminación a través del formulario o correo electrónico</li>
              <li>Verificaremos tu identidad para proteger tu información</li>
              <li>Procesaremos tu solicitud en un plazo máximo de 30 días</li>
              <li>Te notificaremos cuando la eliminación se complete</li>
            </ol>
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Información Importante</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Algunos datos pueden conservarse por obligaciones legales o contables</li>
              <li>Los datos agregados y anonimizados no se eliminan</li>
              <li>La eliminación es permanente y no se puede deshacer</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-base font-semibold text-foreground mb-3">Solicitar Eliminación de Datos</h3>
            <p className="mb-4">
              Para solicitar la eliminación de tus datos personales, puedes contactarnos por:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Correo Electrónico</p>
                  <p className="text-xs">soporte@example.com</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Incluye en tu solicitud: tu nombre, número de teléfono o ID de usuario, 
                y una descripción clara de los datos que deseas eliminar.
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs">
              <strong className="text-foreground">Nota:</strong> Esta página cumple con los requisitos 
              de Facebook para la eliminación de datos de usuarios. Si utilizas nuestro bot a través 
              de Facebook Messenger, puedes solicitar la eliminación de tus datos a través de este proceso.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataDeletion;

