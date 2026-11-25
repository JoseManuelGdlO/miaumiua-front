import { useState, useEffect, useMemo } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { rolesService, CreateRoleData, Permission, Role, UpdateRoleData } from "@/services/rolesService";
import { permissionsService } from "@/services/permissionsService";
import { canAssignPermissions } from "@/utils/permissions";
import { ConfirmCloseDialog, formDirty, useConfirmClose } from "@/components/ConfirmClose";

const EMPTY_ROLE = { name: "", description: "", selectedPermissions: [] as number[] };
const ROLE_NAME_RE = /^[a-z_]+$/;

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
  onRoleCreated?: () => void;
}

const CreateRoleModal = ({ open, onOpenChange, role = null, onRoleCreated }: CreateRoleModalProps) => {
  const { toast } = useToast();
  const isEdit = Boolean(role);
  const canEditPerms = !isEdit || canAssignPermissions();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(EMPTY_ROLE);
  const [baseline, setBaseline] = useState(EMPTY_ROLE);

  const normalized = (state: typeof EMPTY_ROLE) => ({
    name: state.name,
    description: state.description,
    selectedPermissions: [...state.selectedPermissions].sort((a, b) => a - b),
  });

  const { ask, setAsk, requestClose, confirm, onOpenChange: guardClose } = useConfirmClose(
    () => onOpenChange(false),
    formDirty(normalized(formData), normalized(baseline)),
    loading,
  );

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      return;
    }

    let active = true;
    const baseState = role
      ? {
          name: role.nombre,
          description: role.descripcion || "",
          selectedPermissions: (role.permissions || []).map((p) => p.id),
        }
      : EMPTY_ROLE;
    setFormData(baseState);
    setBaseline(baseState);

    if (!canEditPerms) return;

    setFetching(true);
    void Promise.all([
      permissionsService.getAllPermissions({ activos: "true" }),
      role ? rolesService.getRolePermissions(role.id) : Promise.resolve(null),
    ])
      .then(([allRes, rolePermsRes]) => {
        if (!active) return;
        if (allRes.success) {
          setPermissions(allRes.data.permissions);
        }
        if (role && rolePermsRes?.success) {
          const ids = rolePermsRes.data.permissions.filter(Boolean).map((p) => p.id);
          const loaded = {
            name: role.nombre,
            description: role.descripcion || "",
            selectedPermissions: ids,
          };
          setFormData(loaded);
          setBaseline(loaded);
        }
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error al cargar permisos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los permisos",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (active) setFetching(false);
      });

    return () => {
      active = false;
    };
  }, [open, role, canEditPerms, toast]);

  const permissionCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = query
      ? permissions.filter(
          (p) =>
            p.nombre.toLowerCase().includes(query) ||
            p.categoria.toLowerCase().includes(query) ||
            (p.descripcion || "").toLowerCase().includes(query),
        )
      : permissions;

    return filtered.reduce((acc, permission) => {
      const category = permission.categoria;
      if (!acc[category]) acc[category] = [];
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions, searchTerm]);

  const handlePermissionToggle = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter((id) => id !== permissionId)
        : [...prev.selectedPermissions, permissionId],
    }));
  };

  const handleCategoryToggle = (categoryPermissions: Permission[]) => {
    const ids = categoryPermissions.map((p) => p.id);
    setFormData((prev) => {
      const allSelected = ids.every((id) => prev.selectedPermissions.includes(id));
      return {
        ...prev,
        selectedPermissions: allSelected
          ? prev.selectedPermissions.filter((id) => !ids.includes(id))
          : [...new Set([...prev.selectedPermissions, ...ids])],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedDesc = formData.description.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50 || !ROLE_NAME_RE.test(trimmedName)) {
      toast({
        title: "Nombre inválido",
        description: "Usa de 2 a 50 caracteres en minúsculas y guiones bajos (ej: finanzas_marcela).",
        variant: "destructive",
      });
      return;
    }

    if (!isEdit && !trimmedDesc) {
      toast({
        title: "Error",
        description: "La descripción del rol es requerida",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const uniquePermissions = [...new Set(formData.selectedPermissions)];

      if (isEdit && role) {
        const updateData: UpdateRoleData = {
          nombre: trimmedName,
          descripcion: trimmedDesc,
          ...(canEditPerms ? { permissions: uniquePermissions } : {}),
        };
        const response = await rolesService.updateRole(role.id, updateData);
        if (response.success) {
          toast({
            title: "Rol actualizado",
            description: `Cambios guardados en "${trimmedName}". Los usuarios con este rol verán los nuevos permisos al iniciar sesión de nuevo.`,
          });
          onOpenChange(false);
          onRoleCreated?.();
        }
      } else {
        const roleData: CreateRoleData = {
          nombre: trimmedName,
          descripcion: trimmedDesc,
          permissions: uniquePermissions,
        };
        const response = await rolesService.createRole(roleData);
        if (response.success) {
          toast({
            title: "Rol creado",
            description: `Rol "${trimmedName}" creado exitosamente`,
          });
          setFormData(EMPTY_ROLE);
          setBaseline(EMPTY_ROLE);
          onOpenChange(false);
          onRoleCreated?.();
        }
      }
    } catch (error) {
      console.error(isEdit ? "Error al actualizar rol:" : "Error al crear rol:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : isEdit ? "Error al actualizar el rol" : "Error al crear el rol",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const lockName = isEdit && role?.nombre === "super_admin";

  return (
    <Dialog open={open} onOpenChange={guardClose}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 pr-12 text-left">
          <DialogTitle>{isEdit ? `Editar Rol: ${role?.nombre}` : "Crear Nuevo Rol"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos y los permisos asignados a este rol."
              : "Define un nuevo rol con sus permisos específicos para el sistema Miau Miau."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Nombre del Rol *</Label>
                <Input
                  id="roleName"
                  value={formData.name}
                  disabled={lockName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: supervisor_regional"
                />
                <p className="text-xs text-muted-foreground">
                  {lockName
                    ? "El nombre del rol super_admin no se puede cambiar."
                    : "Solo letras minúsculas y guiones bajos (ej: finanzas_marcela)."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleDescription">Descripción {!isEdit ? "*" : ""}</Label>
                <Textarea
                  id="roleDescription"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe las responsabilidades y alcance de este rol..."
                  rows={3}
                />
              </div>
            </div>

            {canEditPerms ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="text-base font-semibold">Permisos del Rol</Label>
                  <Badge variant="secondary">
                    {formData.selectedPermissions.length} permisos seleccionados
                  </Badge>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar permisos por nombre, categoría o descripción..."
                    className="pl-9"
                  />
                </div>

                {fetching ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando permisos...
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {Object.entries(permissionCategories).map(([categoryName, categoryPermissions]) => {
                      const selectedInCategory = categoryPermissions.filter((p) =>
                        formData.selectedPermissions.includes(p.id),
                      ).length;
                      const allSelected = selectedInCategory === categoryPermissions.length;

                      return (
                        <Card key={categoryName}>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-sm font-medium capitalize">{categoryName}</CardTitle>
                              <Badge variant="outline" className="text-xs tabular-nums">
                                {selectedInCategory}/{categoryPermissions.length}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCategoryToggle(categoryPermissions)}
                            >
                              {allSelected ? "Quitar todos" : "Seleccionar todos"}
                            </Button>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {categoryPermissions.map((permission) => (
                                <div key={permission.id} className="flex items-start space-x-2">
                                  <Checkbox
                                    id={`role-perm-${permission.id}`}
                                    checked={formData.selectedPermissions.includes(permission.id)}
                                    onCheckedChange={() => handlePermissionToggle(permission.id)}
                                    className="mt-0.5"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <Label
                                      htmlFor={`role-perm-${permission.id}`}
                                      className={`cursor-pointer text-sm ${permission.tipo === "administracion" ? "font-medium text-destructive" : ""}`}
                                    >
                                      {permission.nombre}
                                      {permission.tipo === "administracion" && (
                                        <Badge variant="outline" className="ml-2 border-destructive text-xs text-destructive">
                                          Crítico
                                        </Badge>
                                      )}
                                    </Label>
                                    {permission.descripcion ? (
                                      <p className="text-xs text-muted-foreground">{permission.descripcion}</p>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {Object.keys(permissionCategories).length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No se encontraron permisos para &ldquo;{searchTerm}&rdquo;.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 border-t bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={requestClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || fetching}>
              {loading ? (isEdit ? "Guardando..." : "Creando...") : isEdit ? "Guardar Cambios" : "Crear Rol"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ConfirmCloseDialog open={ask} onOpenChange={setAsk} onConfirm={confirm} />
    </Dialog>
  );
};

export default CreateRoleModal;
