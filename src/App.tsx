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
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import Promotions from "./pages/Promotions";
import Inventory from "./pages/Inventory";
import Cities from "./pages/Cities";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import RouteManagement from "./pages/RouteManagement";

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
            <Route path="users" element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="orders" element={<Orders />} />
            <Route path="routes" element={<RouteManagement />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="cities" element={<Cities />} />
            <Route path="customers" element={<Customers />} />
            <Route path="agents" element={<div className="p-6"><h1 className="text-2xl font-bold">Contexto de Agentes</h1><p className="text-muted-foreground">Configuración de agentes de IA</p></div>} />
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
