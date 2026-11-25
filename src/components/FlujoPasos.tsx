type Paso = {
  titulo: string;
  texto: string;
};

type FlujoPasosProps = {
  pasos: Paso[];
  columnas?: 2 | 4;
  className?: string;
  numeroClassName?: string;
  textoClassName?: string;
};

export function FlujoPasos({
  pasos,
  columnas = 4,
  className = "",
  numeroClassName = "bg-background text-foreground",
  textoClassName = "text-muted-foreground",
}: FlujoPasosProps) {
  const columnasClase = columnas === 2 ? "sm:grid-cols-2" : "sm:grid-cols-4";

  return (
    <ol className={`grid gap-x-4 gap-y-4 ${columnasClase} ${className}`}>
      {pasos.map((paso, index) => {
        return (
          <li key={paso.titulo}>
            <div className="flex items-center gap-2">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${numeroClassName}`}>
                {index + 1}
              </span>
              <span className="font-semibold text-foreground">{paso.titulo}</span>
            </div>
            <p className={`mt-1 pl-9 text-sm ${textoClassName}`}>{paso.texto}</p>
          </li>
        );
      })}
    </ol>
  );
}
