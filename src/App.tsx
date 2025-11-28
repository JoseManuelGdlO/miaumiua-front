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
import Drivers from "./pages/Drivers";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import Promotions from "./pages/Promotions";
import Inventarios from "./pages/Inventarios";
import Cities from "./pages/Cities";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import RouteManagement from "./pages/RouteManagement";
import Agents from "./pages/Agents";
import Conversations from "./pages/Conversations";
import ConversationDetail from "./pages/ConversationDetail";
import CategoriasProducto from "./pages/CategoriasProducto";
import Pesos from "./pages/Pesos";
import Proveedores from "./pages/Proveedores";
import Packages from "./pages/Packages";
import Notifications from "./pages/Notifications";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DataDeletion from "./pages/DataDeletion";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          {/* Public pages (accessible sin autenticación) */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="roles" element={<Roles />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="conversations/:id" element={<ConversationDetail />} />
            <Route path="orders" element={<Orders />} />
            <Route path="routes" element={<RouteManagement />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="inventory" element={<Inventarios />} />
            <Route path="cities" element={<Cities />} />
            <Route path="customers" element={<Customers />} />
            <Route path="agents" element={<Agents />} />
            <Route path="categorias-producto" element={<CategoriasProducto />} />
            <Route path="pesos" element={<Pesos />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="packages" element={<Packages />} />
            <Route path="notifications" element={<Notifications />} />
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
