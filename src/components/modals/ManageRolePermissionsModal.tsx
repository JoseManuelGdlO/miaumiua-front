import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { rolesService, Permission } from "@/services/rolesService";
import { permissionsService } from "@/services/permissionsService";
import { ConfirmCloseDialog, formDirty, useConfirmClose } from "@/components/ConfirmClose";

interface ManageRolePermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId?: string;
  roleName?: string;
  roleDescription?: string;
  onPermissionsUpdated?: () => void;
}

const ManageRolePermissionsModal = ({ 
  open, 
  onOpenChange, 
  roleId, 
  roleName,
  roleDescription,
  onPermissionsUpdated
}: ManageRolePermissionsModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [baseline, setBaseline] = useState<number[]>([]);
  const [nombre, setNombre] = useState(roleName || "");
  const [descripcion, setDescripcion] = useState(roleDescription || "");

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open && roleId) {
      setNombre(roleName || "");
      setDescripcion(roleDescription || "");
      loadData();
    } else if (!open) {
      // Limpiar filtro cuando se cierra el modal
      setSearchTerm("");
    }
  }, [open, roleId]);

  const loadData = async () => {
    if (!roleId) return;
    
    setLoading(true);
    try {
      // Cargar todos los permisos disponibles
      const permissionsResponse = await permissionsService.getAllPermissions({ activos: 'true' });
      if (permissionsResponse.success) {
        setAllPermissions(permissionsResponse.data.permissions);
      }

      // Cargar permisos del rol
      const rolePermissionsResponse = await rolesService.getRolePermissions(parseInt(roleId));
      if (rolePermissionsResponse.success) {
        setRolePermissions(rolePermissionsResponse.data.permissions);
        const ids = rolePermissionsResponse.data.permissions.map(p => p.id);
        setSelectedPermissions(ids);
        setBaseline(ids);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar permisos por término de búsqueda
  const filteredPermissions = allPermissions.filter(permission => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      permission.nombre.toLowerCase().includes(searchLower) ||
      permission.categoria.toLowerCase().includes(searchLower) ||
      permission.descripcion?.toLowerCase().includes(searchLower) ||
      permission.tipo.toLowerCase().includes(searchLower) ||
      // Búsqueda por palabras clave comunes
      (searchLower.includes('ver') && permission.nombre.toLowerCase().includes('ver')) ||
      (searchLower.includes('crear') && permission.nombre.toLowerCase().includes('crear')) ||
      (searchLower.includes('editar') && permission.nombre.toLowerCase().includes('editar')) ||
      (searchLower.includes('eliminar') && permission.nombre.toLowerCase().includes('eliminar')) ||
      (searchLower.includes('admin') && permission.nombre.toLowerCase().includes('admin')) ||
      (searchLower.includes('sistema') && permission.nombre.toLowerCase().includes('sistema'))
    );
  });

  // Agrupar permisos filtrados por categoría
  const permissionCategories = filteredPermissions.reduce((acc, permission) => {
    const category = permission.categoria;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = async () => {
    if (!roleId) return;
    
    const limpio = nombre.trim();
    if (limpio.length < 2) {
      toast({ title: "Error", description: "El nombre del rol es muy corto", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await rolesService.updateRole(parseInt(roleId), { nombre: limpio, descripcion: descripcion.trim() });
      const currentPermissionIds = rolePermissions.map(p => p.id);
      const permissionsToAdd = selectedPermissions.filter(id => !currentPermissionIds.includes(id));
      const permissionsToRemove = currentPermissionIds.filter(id => !selectedPermissions.includes(id));

      // Agregar nuevos permisos
      for (const permissionId of permissionsToAdd) {
        await rolesService.assignPermission(parseInt(roleId), permissionId);
      }

      // Remover permisos
      for (const permissionId of permissionsToRemove) {
        await rolesService.removePermission(parseInt(roleId), permissionId);
      }

      toast({
        title: "Permisos actualizados",
        description: `Se han actualizado los permisos para el rol "${roleName}"`,
      });

      onOpenChange(false);
      onPermissionsUpdated?.();
    } catch (error) {
      console.error('Error al actualizar permisos:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar los permisos",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const criticalPermissionsCount = selectedPermissions.filter(id => {
    const permission = allPermissions.find(p => p.id === id);
    return permission?.tipo === 'administracion';
  }).length;

  const getCategoryIcon = (categoryName: string) => {
    const icons: Record<string, string> = {
      "Dashboard": "📊",
      "Usuarios": "👥",
      "Roles": "🔐",
      "Permisos": "🛡️",
      "Agentes": "🤖",
      "Inventario": "📦",
      "Clientes": "👤",
      "Marketing": "🎯",
      "Reportes": "📈",
      "Sistema": "⚙️"
    };
    return icons[categoryName] || "📋";
  };

  const { ask, setAsk, requestClose, confirm, onOpenChange: guardClose } = useConfirmClose(
    () => onOpenChange(false),
    formDirty([...selectedPermissions].sort(), [...baseline].sort()),
    saving,
  );

  return (
    <Dialog open={open} onOpenChange={guardClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="role-nombre">Nombre</Label>
            <Input id="role-nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-descripcion">Descripción</Label>
            <Textarea id="role-descripcion" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} rows={2} />
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestionar Permisos - {roleName}
          </DialogTitle>
          <DialogDescription>
            Asigna o revoca permisos para el rol seleccionado. Los permisos marcados como críticos requieren especial atención.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando permisos...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Buscador */}
            <div className="space-y-2">
              <Label htmlFor="search-permissions">Buscar permisos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-permissions"
                  placeholder="Buscar por nombre, categoría, descripción o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    ×
                  </Button>
                )}
              </div>
              {searchTerm && (
                <div className="text-sm text-muted-foreground">
                  {filteredPermissions.length} permiso{filteredPermissions.length !== 1 ? 's' : ''} encontrado{filteredPermissions.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Resumen de permisos */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="font-medium">{selectedPermissions.length}</span> permisos seleccionados
                </div>
                {criticalPermissionsCount > 0 && (
                  <div className="flex items-center space-x-1 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{criticalPermissionsCount} críticos</span>
                  </div>
                )}
              </div>
              <Badge variant="outline">
                {Object.keys(permissionCategories).length} categorías
              </Badge>
            </div>

            {/* Lista de permisos por categoría */}
            <div className="space-y-4">
              {Object.keys(permissionCategories).length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Search className="h-8 w-8 text-muted-foreground" />
                    <div className="text-muted-foreground">
                      {searchTerm ? `No se encontraron permisos para "${searchTerm}"` : "No hay permisos disponibles"}
                    </div>
                    {searchTerm && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                      >
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                Object.entries(permissionCategories).map(([categoryName, categoryPermissions]) => (
                <Card key={categoryName}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="text-lg">{getCategoryIcon(categoryName)}</span>
                      {categoryName}
                      <Badge variant="secondary" className="text-xs">
                        {categoryPermissions.length} permisos
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryPermissions.map((permission) => {
                        const isSelected = selectedPermissions.includes(permission.id);
                        const isCritical = permission.tipo === 'administracion';
                        
                        return (
                          <div key={permission.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                            <Checkbox
                              id={permission.id.toString()}
                              checked={isSelected}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <Label 
                                htmlFor={permission.id.toString()}
                                className={`text-sm font-medium cursor-pointer ${isCritical ? 'text-destructive' : ''}`}
                              >
                                {permission.nombre}
                                {isCritical && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    Crítico
                                  </Badge>
                                )}
                              </Label>
                              {permission.descripcion && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {permission.descripcion}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {permission.tipo}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </div>
        )}

        <Separator />

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={requestClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      <ConfirmCloseDialog open={ask} onOpenChange={setAsk} onConfirm={confirm} />
    </Dialog>
  );
};

export default ManageRolePermissionsModal;