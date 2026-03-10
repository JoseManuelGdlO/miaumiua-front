import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Users,
  MapPin,
  Package,
  TrendingUp,
  MessageSquare,
  ShoppingCart,
  Activity,
  Settings,
  Loader2,
  FileDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import { notificationsService } from "@/services/notificationsService";
import { inventariosService, InventarioStatsResponse } from "@/services/inventariosService";
import { useToast } from "@/hooks/use-toast";
import { hasPermission } from "@/utils/permissions";

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
  status: string;
  actionUrl?: string;
}

interface KPIStat {
  title: string;
  value: string;
  change: string;
  icon: any;
  color: string;
}

interface KPIRawItem {
  valor: number;
  cambioFormato: string;
  formatoMoneda?: string;
}

interface KPIRawData {
  conversacionesActivas: KPIRawItem;
  clientesRegistrados: KPIRawItem;
  ciudadesActivas: KPIRawItem;
  ventasDelMes: KPIRawItem & { formatoMoneda: string };
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DASHBOARD_VERSION = "1.0.0";

const getCurrentMonth = () => new Date().getMonth() + 1;
const getCurrentYear = () => new Date().getFullYear();

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [stats, setStats] = useState<KPIStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(getCurrentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear);
  const [periodoNombre, setPeriodoNombre] = useState<string | null>(null);
  const [kpiRawData, setKpiRawData] = useState<KPIRawData | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventarioStatsResponse["data"] | null>(null);
  const [loadingInventoryStats, setLoadingInventoryStats] = useState(false);

  // Verificar si el usuario tiene permisos para ver notificaciones/KPIs
  const hasNotificationPermission = hasPermission('ver_notificaciones');
  const hasInventoryPermission = hasPermission('inventory');

  const loadDashboardKPIs = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await notificationsService.getDashboardKPIs(selectedYear, selectedMonth);
      
      if (response.success) {
        const kpis: KPIStat[] = [
          {
            title: "Conversaciones Activas",
            value: response.data.conversacionesActivas.valor.toLocaleString(),
            change: response.data.conversacionesActivas.cambioFormato,
            icon: MessageSquare,
            color: "text-primary",
          },
          {
            title: "Clientes Registrados",
            value: response.data.clientesRegistrados.valor.toLocaleString(),
            change: response.data.clientesRegistrados.cambioFormato,
            icon: Users,
            color: "text-success",
          },
          {
            title: "Ciudades Activas",
            value: response.data.ciudadesActivas.valor.toLocaleString(),
            change: response.data.ciudadesActivas.cambioFormato,
            icon: MapPin,
            color: "text-warning",
          },
          {
            title: "Ventas del Mes",
            value: response.data.ventasDelMes.formatoMoneda,
            change: response.data.ventasDelMes.cambioFormato,
            icon: ShoppingCart,
            color: "text-primary",
          },
        ];

        setStats(kpis);
        setPeriodoNombre(response.periodo?.mesActual?.nombre ?? null);
        setKpiRawData({
          conversacionesActivas: {
            valor: response.data.conversacionesActivas.valor,
            cambioFormato: response.data.conversacionesActivas.cambioFormato,
          },
          clientesRegistrados: {
            valor: response.data.clientesRegistrados.valor,
            cambioFormato: response.data.clientesRegistrados.cambioFormato,
          },
          ciudadesActivas: {
            valor: response.data.ciudadesActivas.valor,
            cambioFormato: response.data.ciudadesActivas.cambioFormato,
          },
          ventasDelMes: {
            valor: response.data.ventasDelMes.valor,
            cambioFormato: response.data.ventasDelMes.cambioFormato,
            formatoMoneda: response.data.ventasDelMes.formatoMoneda,
          },
        });
      }
    } catch (error) {
      console.error('Error al cargar KPIs del dashboard:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas del dashboard",
        variant: "destructive",
      });
      
      // Usar valores por defecto en caso de error
      setStats([
        {
          title: "Conversaciones Activas",
          value: "0",
          change: "N/A",
          icon: MessageSquare,
          color: "text-primary",
        },
        {
          title: "Clientes Registrados",
          value: "0",
          change: "N/A",
          icon: Users,
          color: "text-success",
        },
        {
          title: "Ciudades Activas",
          value: "0",
          change: "N/A",
          icon: MapPin,
          color: "text-warning",
        },
        {
          title: "Ventas del Mes",
          value: "$0.00",
          change: "N/A",
          icon: ShoppingCart,
          color: "text-primary",
        },
      ]);
      setKpiRawData(null);
    } finally {
      setLoadingStats(false);
    }
  }, [toast, selectedYear, selectedMonth]);

  const loadRecentActivity = useCallback(async () => {
    try {
      setLoadingActivity(true);
      
      const params: any = {
        limit: 20,
      };
      
      if (activityFilter === 'conversacion') {
        params.tipo = 'conversacion';
      } else if (activityFilter === 'venta') {
        params.tipo = 'venta';
      }

      // Obtener actividades directamente del endpoint (no mapeadas)
      const response = await notificationsService.getRecentActivity(params);
      
      // Convertir las actividades del backend al formato del frontend
      const mappedActivities: RecentActivity[] = response.data.map(act => {
        // Determinar el tipo de actividad y status basado en el tipo del backend
        let activityType = act.titulo;
        let status = act.statusLabel || act.status;
        
        // Construir actionUrl basado en el tipo de actividad
        let actionUrl: string | undefined;
        if (act.datos?.conversacionId) {
          actionUrl = `/dashboard/conversations/${act.datos.conversacionId}`;
        } else if (act.datos?.pedidoId) {
          actionUrl = `/dashboard/orders/${act.datos.pedidoId}`;
        } else if (act.datos?.clienteId) {
          actionUrl = `/dashboard/customers/${act.datos.clienteId}`;
        } else if (act.datos?.inventarioId) {
          actionUrl = `/dashboard/inventory`;
        }
        
        return {
          id: act.id,
          type: activityType,
          description: act.descripcion,
          // Usar el tiempoRelativo que ya viene calculado del backend
          time: act.tiempoRelativo || 'Hace un momento',
          status: status,
          actionUrl: actionUrl,
        };
      });
      
      setRecentActivity(mappedActivities);
    } catch (error) {
      console.error('Error al cargar actividades recientes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades recientes",
        variant: "destructive",
      });
    } finally {
      setLoadingActivity(false);
    }
  }, [activityFilter, toast]);

  const loadInventoryStats = useCallback(async () => {
    try {
      setLoadingInventoryStats(true);
      const response = await inventariosService.getInventarioStats();
      if (response.success) {
        setInventoryStats(response.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas de inventario:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas de inventario",
        variant: "destructive",
      });
    } finally {
      setLoadingInventoryStats(false);
    }
  }, [toast]);

  // Cargar KPIs del dashboard solo si tiene permisos (y al cambiar mes/año)
  useEffect(() => {
    if (hasNotificationPermission) {
      loadDashboardKPIs();

      // Recargar cada 60 segundos
      const interval = setInterval(loadDashboardKPIs, 60000);
      return () => clearInterval(interval);
    } else {
      setLoadingStats(false);
    }
  }, [hasNotificationPermission, loadDashboardKPIs, selectedYear, selectedMonth]);

  // Cargar actividades recientes solo si tiene permisos
  useEffect(() => {
    if (hasNotificationPermission) {
      loadRecentActivity();
      
      // Recargar cada 60 segundos para mantener las actividades actualizadas
      const interval = setInterval(() => {
        loadRecentActivity();
      }, 60000); // 60 segundos
      
      return () => clearInterval(interval);
    } else {
      setLoadingActivity(false);
    }
  }, [activityFilter, hasNotificationPermission, loadRecentActivity]);

  // Cargar estadísticas de inventario para el dashboard
  useEffect(() => {
    if (hasInventoryPermission) {
      loadInventoryStats();
    }
  }, [hasInventoryPermission, loadInventoryStats]);


  const getStatusColor = (status: string) => {
    const colors = {
      activa: "bg-primary text-primary-foreground",
      completada: "bg-success text-success-foreground",
      alerta: "bg-warning text-warning-foreground",
      nuevo: "bg-accent text-accent-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-secondary text-secondary-foreground";
  };

  const downloadInformePDF = () => {
    if (!kpiRawData || !periodoNombre) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = margin;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Informe mensual", pageWidth / 2, yPos, { align: "center" });
      yPos += 8;
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(periodoNombre, pageWidth / 2, yPos, { align: "center" });
      yPos += 12;

      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      const rows = [
        ["Conversaciones activas", String(kpiRawData.conversacionesActivas.valor), kpiRawData.conversacionesActivas.cambioFormato],
        ["Clientes registrados", String(kpiRawData.clientesRegistrados.valor), kpiRawData.clientesRegistrados.cambioFormato],
        ["Ciudades activas", String(kpiRawData.ciudadesActivas.valor), kpiRawData.ciudadesActivas.cambioFormato],
        ["Ventas del mes", kpiRawData.ventasDelMes.formatoMoneda, kpiRawData.ventasDelMes.cambioFormato],
      ];

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Indicador", margin, yPos);
      doc.text("Valor", margin + 80, yPos);
      doc.text("Variación", margin + 130, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      rows.forEach(([label, value, change]) => {
        doc.text(label, margin, yPos);
        doc.text(value, margin + 80, yPos);
        doc.text(change, margin + 130, yPos);
        yPos += 7;
      });

      // Sección de KPIs de inventario (si están disponibles)
      if (inventoryStats) {
        yPos += 5;
        // Salto de página si estamos muy abajo
        if (yPos > 260) {
          doc.addPage();
          yPos = margin;
        }

        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("KPIs de inventario", margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        const invRows: Array<[string, string]> = [
          ["Productos en inventario", inventoryStats.totalInventarios.toLocaleString()],
          ["Productos con stock bajo", inventoryStats.inventariosStockBajo.toLocaleString()],
          ["Productos activos", inventoryStats.inventariosActivos.toLocaleString()],
          ["Productos inactivos", inventoryStats.inventariosInactivos.toLocaleString()],
          [
            "Valor total inventario",
            `$${inventoryStats.valorTotalInventario.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          ],
          [
            "Precio promedio",
            `$${inventoryStats.precioPromedio.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          ],
        ];

        invRows.forEach(([label, value]) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(label, margin, yPos);
          doc.text(value, margin + 80, yPos);
          yPos += 7;
        });
      }

      const safeNombre = periodoNombre.replace(/\s+/g, "_").normalize("NFD").replace(/\p{Diacritic}/gu, "");
      const fileName = `Informe_${safeNombre}.pdf`;
      doc.save(fileName);
      toast({
        title: "PDF generado",
        description: "El informe del mes se ha descargado correctamente",
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  };

  const CHART_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#83a6ed"];

  const barChartData = kpiRawData
    ? [
        { name: "Conversaciones", value: kpiRawData.conversacionesActivas.valor },
        { name: "Clientes", value: kpiRawData.clientesRegistrados.valor },
        { name: "Ciudades", value: kpiRawData.ciudadesActivas.valor },
        { name: "Ventas (miles $)", value: kpiRawData.ventasDelMes.valor / 1000 },
      ]
    : [];

  const pieChartData = kpiRawData
    ? [
        { name: "Conversaciones", value: kpiRawData.conversacionesActivas.valor },
        { name: "Clientes", value: kpiRawData.clientesRegistrados.valor },
        { name: "Ciudades", value: kpiRawData.ciudadesActivas.valor },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Panel de Control - Miau Miau
          </h1>
          <Badge variant="outline" className="text-xs font-normal px-2 py-1">
            Versión dashboard v{DASHBOARD_VERSION}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Gestiona tus bots de WhatsApp, Instagram y Facebook para la venta de arena para gatos
        </p>
      </div>

      {/* Selector de período y Stats Grid - Solo mostrar si tiene permisos */}
      {hasNotificationPermission && (
        <>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Estadísticas de:</span>
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((nombre, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: getCurrentYear() - 2020 + 1 }, (_, i) => getCurrentYear() - i).map((anio) => (
                <SelectItem key={anio} value={String(anio)}>
                  {anio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {periodoNombre && (
            <span className="text-sm text-muted-foreground">
              {periodoNombre}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadInformePDF}
            disabled={loadingStats || !kpiRawData || !periodoNombre}
            className="ml-auto"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Descargar informe PDF
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingStats ? (
            // Mostrar skeletons mientras carga
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-card to-card/80 border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </CardTitle>
                  <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))
          ) : (
            stats.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-card to-card/80 border shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-success font-medium">{stat.change}</span>
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        </>
      )}

      <div className={`grid grid-cols-1 ${hasNotificationPermission ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8`}>
        {/* Recent Activity - Solo mostrar si tiene permisos */}
        {hasNotificationPermission && (
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Actividad Reciente
                  </CardTitle>
                  <CardDescription>
                    Últimas interacciones y eventos del sistema
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={activityFilter} onValueChange={setActivityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="conversacion">Conversaciones</SelectItem>
                      <SelectItem value="venta">Ventas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/dashboard/notifications')}
                  >
                    Ver todas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Cargando actividades...</span>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay actividades recientes</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start space-x-3 p-3 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer"
                    onClick={() => {
                      if (activity.actionUrl) {
                        navigate(activity.actionUrl);
                      }
                    }}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {activity.type}
                        </p>
                        <Badge variant="secondary" className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Acciones Rápidas
            </CardTitle>
            <CardDescription>
              Herramientas más utilizadas para gestionar tu negocio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:bg-primary/5 transition-colors"
                onClick={() => navigate('/dashboard/agents')}
              >
                <Bot className="h-6 w-6" />
                <span className="text-sm">Configurar Agente</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:bg-primary/5 transition-colors"
                onClick={() => navigate('/dashboard/inventory')}
              >
                <Package className="h-6 w-6" />
                <span className="text-sm">Gestionar Inventario</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 hover:bg-primary/5 transition-colors"
                onClick={() => navigate('/dashboard/customers')}
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Ver Clientes</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Resumen de inventario - Solo mostrar si tiene permisos de inventario */}
      {hasInventoryPermission && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Resumen de Inventario
            </CardTitle>
            <CardDescription>
              Visión rápida de productos, stock bajo y valor de inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInventoryStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : inventoryStats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground">Productos en inventario</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {inventoryStats.totalInventarios.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground">Productos con stock bajo</p>
                    <p className="text-2xl font-semibold text-warning mt-1">
                      {inventoryStats.inventariosStockBajo.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground">Valor total del inventario</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {`$${inventoryStats.valorTotalInventario.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Precio promedio: {`$${inventoryStats.precioPromedio.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-64">
                    <h4 className="text-sm font-medium text-foreground mb-3">Estado de productos</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Activos", value: inventoryStats.inventariosActivos },
                          { name: "Inactivos", value: inventoryStats.inventariosInactivos },
                          { name: "Stock bajo", value: inventoryStats.inventariosStockBajo },
                        ]}
                        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {["#8884d8", "#82ca9d", "#ffc658"].map((color, index) => (
                            <Cell key={index} fill={color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-64">
                    <h4 className="text-sm font-medium text-foreground mb-3">Stock total (unidades)</h4>
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-3xl font-semibold text-foreground">
                          {inventoryStats.totalStock.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Unidades en inventario considerando tu ciudad y permisos
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No se pudieron cargar las estadísticas de inventario.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumen de rendimiento del mes seleccionado */}
      {hasNotificationPermission && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Rendimiento Mensual
            </CardTitle>
            <CardDescription>
              {periodoNombre
                ? `Métricas de conversaciones, ventas y satisfacción del cliente — ${periodoNombre}`
                : 'Métricas de conversaciones, ventas y satisfacción del cliente'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className={`p-2 rounded-md bg-background ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground truncate">
                          {stat.title}
                        </p>
                        <p className="text-lg font-semibold text-foreground truncate">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{stat.change}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {kpiRawData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Métricas del mes</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {barChartData.map((_, index) => (
                                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Distribución de actividad (conteos)</h4>
                      <div className="h-64">
                        {pieChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieChartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                              >
                                {pieChartData.map((_, index) => (
                                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-sm text-muted-foreground flex items-center justify-center h-full">
                            No hay datos de conteos para mostrar
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;