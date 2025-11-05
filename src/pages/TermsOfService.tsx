import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Condiciones del Servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Estas Condiciones del Servicio regulan el uso de nuestros productos, servicios y del bot.
            Al utilizar nuestros servicios, aceptas estas condiciones.
          </p>
          <h3 className="text-base font-semibold text-foreground">Uso Aceptable</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>No utilizar los servicios para actividades ilegales o no autorizadas</li>
            <li>Respetar la privacidad y datos de otros usuarios</li>
            <li>No interferir con el funcionamiento del servicio o del bot</li>
          </ul>
          <h3 className="text-base font-semibold text-foreground">Limitación de Responsabilidad</h3>
          <p>
            Proveemos los servicios "tal cual". No garantizamos disponibilidad ininterrumpida.
            En la medida máxima permitida por la ley, no seremos responsables por daños indirectos.
          </p>
          <h3 className="text-base font-semibold text-foreground">Cambios</h3>
          <p>
            Podemos actualizar estas condiciones. Los cambios entrarán en vigor al publicarse en esta página.
          </p>
          <h3 className="text-base font-semibold text-foreground">Contacto</h3>
          <p>
            Si tienes preguntas sobre estas condiciones, contáctanos en: legal@example.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;


