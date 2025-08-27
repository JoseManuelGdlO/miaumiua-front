import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./pages/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<div className="p-6"><h1 className="text-2xl font-bold">Usuarios</h1><p className="text-muted-foreground">Gestión de usuarios del sistema</p></div>} />
            <Route path="roles" element={<div className="p-6"><h1 className="text-2xl font-bold">Roles</h1><p className="text-muted-foreground">Configuración de roles</p></div>} />
            <Route path="permissions" element={<div className="p-6"><h1 className="text-2xl font-bold">Permisos</h1><p className="text-muted-foreground">Gestión de permisos</p></div>} />
            <Route path="agents" element={<div className="p-6"><h1 className="text-2xl font-bold">Contexto de Agentes</h1><p className="text-muted-foreground">Configuración de agentes de IA</p></div>} />
            <Route path="promotions" element={<div className="p-6"><h1 className="text-2xl font-bold">Promociones</h1><p className="text-muted-foreground">Gestión de promociones y descuentos</p></div>} />
            <Route path="inventory" element={<div className="p-6"><h1 className="text-2xl font-bold">Inventario</h1><p className="text-muted-foreground">Control de stock por ciudad</p></div>} />
            <Route path="cities" element={<div className="p-6"><h1 className="text-2xl font-bold">Ciudades</h1><p className="text-muted-foreground">Gestión de ciudades disponibles</p></div>} />
            <Route path="customers" element={<div className="p-6"><h1 className="text-2xl font-bold">Clientes</h1><p className="text-muted-foreground">Base de datos de clientes</p></div>} />
            <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Configuración</h1><p className="text-muted-foreground">Configuración general del sistema</p></div>} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
