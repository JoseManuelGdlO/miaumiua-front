import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationPanel from "@/components/NotificationPanel";

const DashboardLayout = () => {
  const handleLogout = () => {
    // Navigate back to login
    window.location.href = "/";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-foreground hover:bg-accent hover:text-accent-foreground" />
              <div className="text-sm text-muted-foreground">
                Última actualización: {new Date().toLocaleString()}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <NotificationPanel />
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Administrador</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notificaciones</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto relative">
            <Outlet />
            
            {/* Intelekia Logo - Bottom Left */}
            <div className="fixed bottom-4 left-4 z-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
                <img 
                  src="/lovable-uploads/e7d6a686-c959-4e3a-9e6e-f7de95f74e9e.png" 
                  alt="Powered by Intelekia" 
                  className="w-20 h-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;