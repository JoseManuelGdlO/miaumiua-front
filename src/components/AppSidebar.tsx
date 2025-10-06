import { useState } from "react";
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
} from "lucide-react";
import { hasSectionAccess } from "@/utils/permissions";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import miauMiauLogo from "/lovable-uploads/9f868334-2970-46f8-a783-9ab32ecc297b.png";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home, permission: null },
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
  { title: "Conversaciones", url: "/dashboard/conversations", icon: MessageCircle, permission: "conversations" },
  { title: "Contexto de Agentes", url: "/dashboard/agents", icon: Bot, permission: null },
  { title: "Pedidos", url: "/dashboard/orders", icon: Package2, permission: "orders" },
  { title: "Repartidores", url: "/dashboard/drivers", icon: Truck, permission: "drivers" },
  { title: "Planeación de Rutas", url: "/dashboard/routes", icon: Route, permission: "routes" },
  { title: "Promociones", url: "/dashboard/promotions", icon: Tag, permission: "promotions" },
  { title: "Inventario", url: "/dashboard/inventory", icon: Package, permission: "inventory" },
  { title: "Ciudades", url: "/dashboard/cities", icon: MapPin, permission: "cities" },
  { title: "Clientes", url: "/dashboard/customers", icon: UserCheck, permission: "customers" },
  {
    title: "Configuraciones",
    icon: Settings,
    permission: "categories",
    submenu: [
      { title: "Categorías Producto", url: "/dashboard/categorias-producto", permission: "categories" },
      { title: "Pesos", url: "/dashboard/pesos", permission: "weights" },
      { title: "Proveedores", url: "/dashboard/proveedores", permission: "suppliers" },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (submenu: any[]) => 
    submenu.some(item => currentPath === item.url);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const getNavClasses = (isActive: boolean) =>
    `flex items-center w-full text-left transition-colors ${
      isActive 
        ? "bg-primary text-primary-foreground font-medium" 
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-64"} border-r border-sidebar-border bg-sidebar transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden">
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

      {/* Sidebar trigger - only visible when collapsed */}
      {isCollapsed && (
        <SidebarTrigger className="m-2 self-start" />
      )}

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-medium mb-2">
            {!isCollapsed && "NAVEGACIÓN PRINCIPAL"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                // Check if user has access to this section
                if (item.permission && !hasSectionAccess(item.permission as any)) {
                  return null;
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    {item.submenu ? (
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
                    ) : (
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          className={getNavClasses(isActive(item.url))}
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
      </SidebarContent>
    </Sidebar>
  );
}