import { useEffect, useRef, useState, type ComponentType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Users,
  Bot,
  Tag,
  Package,
  Package2,
  MapPin,
  UserCheck,
  ChevronDown,
  Home,
  Settings,
  Route,
  MessageCircle,
  Layers,
  Weight,
  Truck,
  Flag,
  Globe,
  QrCode,
  Headphones,
} from "lucide-react";
import { canConfigureSystem, hasSectionAccess } from "@/utils/permissions";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { authService } from "@/services/authService";
import { callCenterService } from "@/services/callCenterService";
import miauMiauLogo from "/lovable-uploads/9f868334-2970-46f8-a783-9ab32ecc297b.png";

type MenuItem = {
  title: string;
  url?: string;
  icon: ComponentType<{ className?: string }>;
  permission: string | null;
  requireConfigureSystem?: boolean;
  submenu?: { title: string; url: string; permission: string | null; adminOnly?: boolean }[];
};

const menuSections: { label: string | null; items: MenuItem[] }[] = [
  {
    label: null,
    items: [{ title: "Dashboard", url: "/dashboard", icon: Home, permission: null }],
  },
  {
    label: "Operaciones",
    items: [
      { title: "Conversaciones", url: "/dashboard/conversations", icon: MessageCircle, permission: "conversations" },
      { title: "Contexto de Agentes", url: "/dashboard/agents", icon: Bot, permission: "agents" },
      { title: "Clientes", url: "/dashboard/customers", icon: UserCheck, permission: "customers" },
      { title: "Repartidores", url: "/dashboard/drivers", icon: Truck, permission: "drivers" },
      { title: "Pedidos", url: "/dashboard/orders", icon: Package2, permission: "orders" },
      {
        title: "Planeación de Rutas",
        icon: Route,
        permission: "routes",
        submenu: [
          { title: "Crear ruta", url: "/dashboard/routes", permission: "routes" },
          { title: "Rutas planificadas", url: "/dashboard/routes/planificadas", permission: "routes" },
        ],
      },
      { title: "Call Center", url: "/dashboard/call-center", icon: Headphones, permission: "callCenter" },
      { title: "Promociones", url: "/dashboard/promotions", icon: Tag, permission: "promotions" },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        title: "Gestión de Usuarios",
        icon: Users,
        permission: "users",
        submenu: [
          { title: "Usuarios", url: "/dashboard/users", permission: "users" },
          { title: "Roles", url: "/dashboard/roles", permission: "roles" },
          { title: "Permisos", url: "/dashboard/permissions", permission: "permissions" },
          { title: "Historial", url: "/dashboard/historial", permission: null, adminOnly: true },
        ],
      },
      { title: "Inventario", url: "/dashboard/inventory", icon: Package, permission: "inventory" },
      { title: "Paquetes", url: "/dashboard/packages", icon: Package2, permission: "packages" },
      { title: "Ciudades", url: "/dashboard/cities", icon: MapPin, permission: "cities" },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Sitio web",
        url: "/dashboard/settings",
        icon: Globe,
        permission: null,
        requireConfigureSystem: true,
      },
      { title: "Configuración QR", url: "/dashboard/configuracion-qr", icon: QrCode, permission: "qr" },
      {
        title: "Configuraciones",
        icon: Settings,
        permission: "categories",
        submenu: [
          { title: "Categorías Producto", url: "/dashboard/categorias-producto", permission: "categories" },
          { title: "Pesos", url: "/dashboard/pesos", permission: "weights" },
          { title: "Proveedores", url: "/dashboard/proveedores", permission: "suppliers" },
          { title: "Flags", url: "/dashboard/flags", permission: "conversations" },
        ],
      },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const avisosCola = useNotificationStream()?.avisos ?? [];
  const [pendientesCall, setPendientesCall] = useState(0);
  useEffect(() => {
    if (!hasSectionAccess("callCenter")) return;
    let vivo = true;
    const cargar = () => {
      Promise.all([
        callCenterService.listSolicitudes(),
        callCenterService.listPedidos({}),
      ]).then(([solicitudes, pedidos]) => {
        if (!vivo) return;
        const avisos = solicitudes.filter((row) => row.tipo === "check_in" || row.tipo === "llamada_cliente" || row.tipo === "soporte" || row.tipo === "cierre_dia").length;
        const incidencias = pedidos.filter((row) => row.estado === "no_entregado" || row.estado_entrega === "fallido").length;
        setPendientesCall(avisos + incidencias);
      }).catch(() => {});
    };
    cargar();
    const timer = window.setInterval(cargar, 20000);
    return () => {
      vivo = false;
      window.clearInterval(timer);
    };
  }, []);
  const location = useLocation();
  const currentPath = location.pathname;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [flyout, setFlyout] = useState<string | null>(null);
  const flyoutTimer = useRef<number | null>(null);
  
  const isCollapsed = state === "collapsed";

  const openFlyout = (title: string) => {
    if (flyoutTimer.current) window.clearTimeout(flyoutTimer.current);
    setFlyout(title);
  };

  const closeFlyout = () => {
    if (flyoutTimer.current) window.clearTimeout(flyoutTimer.current);
    flyoutTimer.current = window.setTimeout(() => setFlyout(null), 150);
  };

  const destino = (url?: string) => {
    if (!url) return "/dashboard";
    const aviso = avisosCola.find((item) => item.ruta.startsWith(url));
    return aviso?.ruta || url;
  };
  const tieneAviso = (url?: string) => Boolean(url && (avisosCola.some((item) => item.ruta.startsWith(url)) || (url === "/dashboard/call-center" && pendientesCall > 0)));
  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (submenu: any[]) => 
    submenu.some(item => currentPath === item.url);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const puedeVer = (item: { permission: string | null; adminOnly?: boolean }) => {
    if (item.adminOnly) {
      const rol = authService.getUserData()?.rol?.nombre;
      return rol === "admin" || rol === "super_admin";
    }
    if (item.permission && !hasSectionAccess(item.permission as never)) return false;
    return true;
  };

  const getNavClasses = (active: boolean) => {
    if (!active) {
      return "flex w-full items-center text-left text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
    }
    if (isCollapsed) {
      return "mx-auto flex items-center justify-center bg-primary/10 font-medium text-primary !rounded-xl";
    }
    return "relative flex w-full items-center rounded-lg bg-primary/10 pl-3 text-left font-medium text-primary transition-colors before:absolute before:left-1 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-primary";
  };

  return (
    <Sidebar
      collapsible="icon"
      variant={isCollapsed ? "floating" : "sidebar"}
      className={isCollapsed ? undefined : "border-r border-sidebar-border bg-sidebar"}
    >
      <div className={`flex-shrink-0 ${isCollapsed ? "flex justify-center px-1 pb-1 pt-2" : "border-b border-sidebar-border p-4"}`}>
        <div className="flex items-center space-x-3">
          <div className={`rounded-xl overflow-hidden ${isCollapsed ? "h-8 w-8" : "h-12 w-12"}`}>
            <img 
              src={miauMiauLogo} 
              alt="Miau Miau Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">Miau Miau</h2>
              <p className="text-xs text-sidebar-foreground/70">Bot Manager</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className={isCollapsed ? "min-h-0 flex-1 gap-0 overflow-y-auto p-1" : "min-h-0 flex-1 overflow-y-auto p-2"}>
        {menuSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (item.requireConfigureSystem && !canConfigureSystem()) return false;
            if (item.permission && !hasSectionAccess(item.permission as never)) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;

          return (
        <SidebarGroup key={section.label ?? "inicio"} className={isCollapsed ? "p-0" : undefined}>
          {section.label && !isCollapsed && (
            <SidebarGroupLabel className="mb-1 h-auto px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {section.label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className={isCollapsed ? "items-center" : "space-y-1"}>
              {visibleItems.map((item) => {
                return (
                  <SidebarMenuItem key={item.title} className={isCollapsed ? "flex justify-center" : undefined}>
                    {item.submenu ? (
                      isCollapsed ? (
                      <DropdownMenu
                        modal={false}
                        open={flyout === item.title}
                        onOpenChange={(open) => (open ? openFlyout(item.title) : closeFlyout())}
                      >
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton
                            className={`mx-auto justify-center ${getNavClasses(isGroupActive(item.submenu))}`}
                            onMouseEnter={() => openFlyout(item.title)}
                            onMouseLeave={closeFlyout}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="right"
                          align="start"
                          sideOffset={12}
                          className="z-50 min-w-48"
                          onMouseEnter={() => openFlyout(item.title)}
                          onMouseLeave={closeFlyout}
                        >
                          <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {item.submenu.map((subItem) => {
                            if (!puedeVer(subItem)) {
                              return null;
                            }
                            return (
                              <DropdownMenuItem key={subItem.title} asChild>
                                <NavLink
                                  to={subItem.url}
                                  className={isActive(subItem.url) ? "bg-primary/10 text-primary font-medium" : ""}
                                >
                                  {subItem.title}
                                </NavLink>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      ) : (
                      <Collapsible
                        open={openGroups[item.title] || isGroupActive(item.submenu)}
                        onOpenChange={() => toggleGroup(item.title)}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={getNavClasses(isGroupActive(item.submenu))}
                            tooltip={item.title}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && (
                              <>
                                <span className="flex-1">{item.title}</span>
                                <ChevronDown className="h-4 w-4 transition-transform" />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!isCollapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub className="ml-4 mt-2 border-l border-sidebar-border pl-4">
                              {item.submenu.map((subItem) => {
                                if (!puedeVer(subItem)) {
                                  return null;
                                }

                                return (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton asChild>
                                      <NavLink
                                        to={destino(subItem.url)}
                                        className={getNavClasses(isActive(subItem.url))}
                                      >
                                        <span className="text-sm">{subItem.title}</span>
                                        {tieneAviso(subItem.url) ? <span className="ml-auto h-2 w-2 rounded-full bg-red-500" aria-label="Hay un aviso" /> : null}
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                      )
                    ) : (
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={destino(item.url)}
                          className={`relative ${isCollapsed ? "mx-auto justify-center" : ""} ${getNavClasses(isActive(item.url ?? ""))} ${item.url === "/dashboard/call-center" && tieneAviso(item.url) ? "aviso-borde" : ""}`}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!isCollapsed && <span>{item.title}</span>}
                          {tieneAviso(item.url) && (
                            <span
                              className={`${isCollapsed ? "absolute right-1.5 top-1.5" : "ml-auto"} h-2 w-2 shrink-0 rounded-full bg-red-500`}
                              aria-label="Hay avisos"
                            />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}