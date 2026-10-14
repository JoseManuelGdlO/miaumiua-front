import { useRef, useState, type ComponentType } from "react";
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
import miauMiauLogo from "/lovable-uploads/9f868334-2970-46f8-a783-9ab32ecc297b.png";

type MenuItem = {
  title: string;
  url?: string;
  icon: ComponentType<{ className?: string }>;
  permission: string | null;
  requireConfigureSystem?: boolean;
  submenu?: { title: string; url: string; permission: string | null }[];
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
      { title: "Pedidos", url: "/dashboard/orders", icon: Package2, permission: "orders" },
      { title: "Call Center", url: "/dashboard/call-center", icon: Headphones, permission: "callCenter" },
      { title: "Repartidores", url: "/dashboard/drivers", icon: Truck, permission: "drivers" },
      { title: "Planeación de Rutas", url: "/dashboard/routes", icon: Route, permission: "routes" },
      { title: "Promociones", url: "/dashboard/promotions", icon: Tag, permission: "promotions" },
      { title: "Clientes", url: "/dashboard/customers", icon: UserCheck, permission: "customers" },
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

  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (submenu: any[]) => 
    submenu.some(item => currentPath === item.url);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
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
                            if (subItem.permission && !hasSectionAccess(subItem.permission as never)) {
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
                                // Check if user has access to this submenu item
                                if (subItem.permission && !hasSectionAccess(subItem.permission as any)) {
                                  return null;
                                }

                                return (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton asChild>
                                      <NavLink
                                        to={subItem.url}
                                        className={getNavClasses(isActive(subItem.url))}
                                      >
                                        <span className="text-sm">{subItem.title}</span>
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
                          to={item.url ?? "/dashboard"}
                          className={`${isCollapsed ? "mx-auto justify-center" : ""} ${getNavClasses(isActive(item.url ?? ""))}`}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!isCollapsed && <span>{item.title}</span>}
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