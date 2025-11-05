import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Política de Privacidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos la
            información personal de los usuarios de nuestros servicios y del bot.
          </p>
          <p>
            Al utilizar nuestros servicios, aceptas las prácticas descritas en esta política.
            Te recomendamos revisar periódicamente esta página para ver posibles actualizaciones.
          </p>
          <h3 className="text-base font-semibold text-foreground">Información que recopilamos</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Datos de contacto (por ejemplo: nombre, teléfono, correo)</li>
            <li>Mensajes e interacciones con el bot</li>
            <li>Datos técnicos (por ejemplo: IP, dispositivo, navegador)</li>
          </ul>
          <h3 className="text-base font-semibold text-foreground">Uso de la información</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Proveer y mejorar nuestros servicios y la experiencia del bot</li>
            <li>Atención al cliente y soporte</li>
            <li>Cumplimiento de requisitos legales</li>
          </ul>
          <h3 className="text-base font-semibold text-foreground">Contacto</h3>
          <p>
            Si tienes preguntas sobre esta política, contáctanos en: soporte@example.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;


