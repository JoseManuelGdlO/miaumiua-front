import { Fragment, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authService } from "@/services/authService";
import { vistaDeError } from "@/lib/api-error";
import { listarHistorial, type Cambio } from "@/services/historialService";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  super_admin: "bg-purple-100 text-purple-800 border-purple-200",
  supervisor_ventas: "bg-orange-100 text-orange-800 border-orange-200",
  supervisor_tecnico: "bg-yellow-100 text-yellow-800 border-yellow-200",
  agente_chat: "bg-green-100 text-green-800 border-green-200",
  inventario: "bg-gray-100 text-gray-800 border-gray-200",
  marketing: "bg-pink-100 text-pink-800 border-pink-200",
};

function RoleBadge({ roleName }: { roleName: string }) {
  return <Badge className={ROLE_COLORS[roleName] || "bg-gray-100 text-gray-800 border-gray-200"}>{roleName}</Badge>;
}

const ACCIONES = [
  ["all", "Todas las acciones"],
  ["creacion", "Creación"],
  ["edicion", "Edición"],
  ["eliminacion", "Eliminación"],
  ["cierre_sin_codigo", "Cierre sin código"],
];

function esAdmin() {
  const rol = authService.getUserData()?.rol?.nombre;
  return rol === "admin" || rol === "super_admin";
}

const Historial = () => {
  const [search, setSearch] = useState("");
  const [accion, setAccion] = useState("all");
  const [rows, setRows] = useState<Cambio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [abierto, setAbierto] = useState<number | null>(null);

  useEffect(() => {
    if (!esAdmin()) {
      setLoading(false);
      setError("Solo un administrador puede ver el historial.");
      return;
    }
    const timer = window.setTimeout(() => {
      setLoading(true);
      listarHistorial({ search, accion })
        .then((data) => {
          setRows(data);
          setError("");
        })
        .catch((cause: unknown) => {
          setRows([]);
          setError(vistaDeError(cause instanceof Error ? cause.message : "No se pudo leer el historial"));
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, accion]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historial de cambios</h1>
        <p className="text-muted-foreground">Movimientos recientes de los usuarios del backoffice.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recientes</CardTitle>
          <CardDescription>Busca por texto o filtra por el tipo de acción.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar en el detalle" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={accion} onValueChange={setAccion}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCIONES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={5} className="whitespace-pre-line py-8 text-center text-muted-foreground">{error}</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Todavía no hay cambios registrados</TableCell></TableRow>
                ) : rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow className="cursor-pointer" onClick={() => setAbierto((actual) => actual === row.id ? null : row.id)}>
                      <TableCell>{row.creado_en ? new Date(row.creado_en).toLocaleString("es-MX") : "—"}</TableCell>
                      <TableCell>{row.usuario?.nombre || "—"}</TableCell>
                      <TableCell>{row.usuario?.rol ? <RoleBadge roleName={row.usuario.rol} /> : "—"}</TableCell>
                      <TableCell>{row.accion}</TableCell>
                      <TableCell>{row.detalle}</TableCell>
                    </TableRow>
                    {abierto === row.id ? (
                      <TableRow key={`${row.id}-detalle`}>
                        <TableCell colSpan={5} className="bg-pink-50">
                          <p>Usuario: {row.usuario?.nombre || "—"}{row.usuario?.correo ? ` · ${row.usuario.correo}` : ""}</p>
                          <p>Entidad: {row.entidad}{row.entidad_id ? ` ${row.entidad_id}` : ""}</p>
                          {row.contexto ? <pre className="mt-2 whitespace-pre-wrap text-sm">{row.contexto}</pre> : <p className="mt-2">Este cambio no guardó IP ni cuerpo.</p>}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Historial;
