import { cn } from "@/lib/utils";
import { Stethoscope, Truck, User } from "lucide-react";

export type TipoCuenta = "general" | "veterinaria" | "distribuidor";

const OPCIONES: { id: TipoCuenta; title: string; hint: string; Icon: typeof User }[] = [
  { id: "general", title: "General", hint: "Tarifa de lista", Icon: User },
  { id: "veterinaria", title: "Veterinaria", hint: "Tarifa preferencial", Icon: Stethoscope },
  { id: "distribuidor", title: "Distribuidor", hint: "Tarifa mayoreo y bot", Icon: Truck },
];

export function tipoDesdeCliente(cliente?: { tipo_cuenta?: string | null; es_distribuidor?: boolean } | null): TipoCuenta {
  if (cliente?.tipo_cuenta === "veterinaria" || cliente?.tipo_cuenta === "distribuidor" || cliente?.tipo_cuenta === "general") {
    return cliente.tipo_cuenta;
  }
  return cliente?.es_distribuidor ? "distribuidor" : "general";
}

export function TipoCuentaCards({
  value,
  onChange,
}: {
  value: TipoCuenta;
  onChange: (value: TipoCuenta) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPCIONES.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "rounded-md border px-3 py-3 text-left",
              active ? "border-primary bg-primary/10" : "border-border bg-background",
            )}
          >
            <item.Icon className={cn("mb-2 h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
            <div className="text-sm font-medium">{item.title}</div>
            <div className="text-xs text-muted-foreground">{item.hint}</div>
          </button>
        );
      })}
    </div>
  );
}
