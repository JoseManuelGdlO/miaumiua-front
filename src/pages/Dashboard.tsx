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
  Info,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  Shield,
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
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import jsPDF from "jspdf";
import { notificationsService } from "@/services/notificationsService";
import { inventariosService, InventarioStatsResponse } from "@/services/inventariosService";
import { useToast } from "@/hooks/use-toast";
import { hasPermission } from "@/utils/permissions";
import { StatCard, statToneText, type StatTone } from "@/components/StatCard";
import { formatCount, formatMoney } from "@/utils/format";

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
  tone: StatTone;
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

const INVENTORY_BARS = [
  { key: "inventariosActivos" as const, name: "Activos", fill: "hsl(var(--primary))" },
  { key: "inventariosInactivos" as const, name: "Inactivos", fill: "hsl(var(--primary) / 0.55)" },
  { key: "inventariosStockBajo" as const, name: "Stock bajo", fill: "hsl(var(--primary) / 0.28)" },
];

function InventorySummary({ stats }: { stats: InventarioStatsResponse["data"] }) {
  const chartData = INVENTORY_BARS.map((bar) => ({
    name: bar.name,
    value: stats[bar.key],
    fill: bar.fill,
  }));
  const totalProductos = stats.totalInventarios;
  const sinStockBajo = Math.max(totalProductos - stats.inventariosStockBajo, 0);
  const disponibilidad = totalProductos > 0 ? (sinStockBajo / totalProductos) * 100 : 0;
  const disponibilidadLabel = disponibilidad.toLocaleString("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-muted-foreground">Productos en inventario</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {formatCount(stats.totalInventarios)}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {formatCount(stats.inventariosActivos)} activos en el catálogo
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-muted-foreground">Productos con stock bajo</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className={`mt-3 text-3xl font-bold tracking-tight ${stats.inventariosStockBajo > 0 ? "text-warning" : "text-foreground"}`}>
            {formatCount(stats.inventariosStockBajo)}
          </p>
          <p className={`mt-3 flex items-center gap-1.5 text-xs ${stats.inventariosStockBajo > 0 ? "text-warning" : "text-muted-foreground"}`}>
            <Shield className="h-3.5 w-3.5" />
            {stats.inventariosStockBajo > 0
              ? `${formatCount(stats.inventariosStockBajo)} por reponer`
              : "Niveles de reserva saludables"}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-muted-foreground">Valor total del inventario</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {formatMoney(stats.valorTotalInventario)}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Precio promedio: {formatMoney(stats.precioPromedio)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="border bg-background/60 shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Estado de productos</CardTitle>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Distribución actual</span>
            {INVENTORY_BARS.map((bar) => (
              <span key={bar.name} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: bar.fill }} />
                {bar.name}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--accent))" }}
                  formatter={(value) => [formatCount(Number(value)), "Productos"]}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={72}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(value) => formatCount(Number(value))}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border bg-gradient-to-br from-card to-primary/5 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Stock total (unidades)</CardTitle>
          <span
            className="text-muted-foreground"
            title="Unidades en inventario según tu ciudad y permisos operativos"
          >
            <Info className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent className="flex flex-col items-center px-6 pb-8 pt-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Volumen consolidado
          </p>
          <p className="mt-1 text-5xl font-bold tracking-tight text-foreground">
            {formatCount(stats.totalStock)}
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Unidades en inventario considerando tu ciudad y permisos operativos vigentes
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {disponibilidadLabel}% disponibilidad
            </span>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}

const getCurrentMonth = () => new Date().getMonth() + 1;
const getCurrentYear = () => new Date().getFullYear();

const MONTHLY_BAR_COLORS = [
  "hsl(var(--primary))",
  "hsl(330 62% 74%)",
  "hsl(330 42% 84%)",
  "hsl(330 76% 48%)",
];

function changeClassName(change: string) {
  const value = Number(change.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(value) || value === 0) return "text-muted-foreground";
  return value > 0 ? "text-success" : "text-destructive";
}

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
            value: formatCount(response.data.conversacionesActivas.valor),
            change: response.data.conversacionesActivas.cambioFormato,
            icon: MessageSquare,
            tone: "primary",
          },
          {
            title: "Clientes Registrados",
            value: formatCount(response.data.clientesRegistrados.valor),
            change: response.data.clientesRegistrados.cambioFormato,
            icon: Users,
            tone: "success",
          },
          {
            title: "Ciudades Activas",
            value: formatCount(response.data.ciudadesActivas.valor),
            change: response.data.ciudadesActivas.cambioFormato,
            icon: MapPin,
            tone: "info",
          },
          {
            title: "Ventas del Mes",
            value: formatMoney(response.data.ventasDelMes.valor),
            change: response.data.ventasDelMes.cambioFormato,
            icon: ShoppingCart,
            tone: "primary",
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
          value: formatCount(0),
          change: "N/A",
          icon: MessageSquare,
          tone: "primary",
        },
        {
          title: "Clientes Registrados",
          value: formatCount(0),
          change: "N/A",
          icon: Users,
          tone: "success",
        },
        {
          title: "Ciudades Activas",
          value: formatCount(0),
          change: "N/A",
          icon: MapPin,
          tone: "info",
        },
        {
          title: "Ventas del Mes",
          value: formatMoney(0),
          change: "N/A",
          icon: ShoppingCart,
          tone: "primary",
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

  const CHART_COLORS = MONTHLY_BAR_COLORS;

  const barChartData = kpiRawData
    ? [
        { name: "Conversaciones", value: kpiRawData.conversacionesActivas.valor, fill: CHART_COLORS[0] },
        { name: "Clientes", value: kpiRawData.clientesRegistrados.valor, fill: CHART_COLORS[1] },
        { name: "Ciudades", value: kpiRawData.ciudadesActivas.valor, fill: CHART_COLORS[2] },
        { name: "Ventas (miles $)", value: kpiRawData.ventasDelMes.valor / 1000, fill: CHART_COLORS[3] },
      ]
    : [];

  const pieChartData = kpiRawData
    ? [
        { name: "Conversaciones", value: kpiRawData.conversacionesActivas.valor, fill: CHART_COLORS[0] },
        { name: "Clientes", value: kpiRawData.clientesRegistrados.valor, fill: CHART_COLORS[1] },
        { name: "Ciudades", value: kpiRawData.ciudadesActivas.valor, fill: CHART_COLORS[2] },
      ].filter((d) => d.value > 0)
    : [];
  const pieTotal = pieChartData.reduce((sum, item) => sum + item.value, 0);
  const isCurrentPeriod = selectedMonth === getCurrentMonth() && selectedYear === getCurrentYear();
  const timeZoneLabel = (() => {
    const shortName = new Intl.DateTimeFormat("es-MX", { timeZoneName: "short" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;
    const offsetMinutes = -new Date().getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const hours = Math.trunc(Math.abs(offsetMinutes) / 60);
    return `${shortName ?? "Local"} (UTC${sign}${hours})`;
  })();

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  </CardTitle>
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="mb-2 h-8 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))
          ) : (
            stats.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                hint={<span className="font-medium text-success">{stat.change}</span>}
                icon={stat.icon}
                tone={stat.tone}
              />
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/50" />
                ))}
              </div>
            ) : inventoryStats ? (
              <InventorySummary stats={inventoryStats} />
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Rendimiento Mensual
                  <Badge variant="outline" className="border-primary/20 bg-primary/10 font-normal text-primary">
                    {isCurrentPeriod ? "Cierre preliminar" : "Cerrado"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {periodoNombre
                    ? `Métricas de conversaciones, ventas y satisfacción del cliente — ${periodoNombre}`
                    : "Métricas de conversaciones, ventas y satisfacción del cliente"}
                </CardDescription>
              </div>
              <p className="text-xs text-muted-foreground">Zona horaria: {timeZoneLabel}</p>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/50" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.title}
                      className="rounded-xl border border-border/60 bg-muted/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <div className={`rounded-md bg-background p-2 ${statToneText[stat.tone]}`}>
                          <stat.icon className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                      <p className="mt-3 text-xs">
                        <span className={`font-medium ${changeClassName(stat.change)}`}>{stat.change}</span>
                        <span className="text-muted-foreground"> desde el mes pasado</span>
                      </p>
                    </div>
                  ))}
                </div>

                {kpiRawData && (
                  <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-border/60 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-medium text-foreground">Métricas del mes</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>Comparativa consolidada</span>
                          {barChartData.map((item, index) => (
                            <span key={item.name} className="inline-flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{ backgroundColor: MONTHLY_BAR_COLORS[index % MONTHLY_BAR_COLORS.length] }}
                              />
                              {item.name.replace(" (miles $)", "")}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barChartData} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                            <Tooltip cursor={{ fill: "hsl(var(--accent))" }} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={56}>
                              {barChartData.map((item, index) => (
                                <Cell key={item.name} fill={MONTHLY_BAR_COLORS[index % MONTHLY_BAR_COLORS.length]} />
                              ))}
                              <LabelList
                                dataKey="value"
                                position="top"
                                className="fill-foreground"
                                fontSize={11}
                                formatter={(value) => {
                                  const amount = Number(value);
                                  return Number.isInteger(amount)
                                    ? formatCount(amount)
                                    : amount.toLocaleString("es-MX", { maximumFractionDigits: 2 });
                                }}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h4 className="text-sm font-medium text-foreground">Distribución de actividad (conteos)</h4>
                        <span className="text-xs text-muted-foreground">
                          Total: {formatCount(pieTotal)} eventos
                        </span>
                      </div>
                      {pieChartData.length > 0 ? (
                        <>
                          <div className="relative h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieChartData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={62}
                                  outerRadius={86}
                                  paddingAngle={2}
                                  stroke="none"
                                >
                                  {pieChartData.map((item) => (
                                    <Cell key={item.name} fill={item.fill} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-foreground">
                                {formatCount(pieTotal)}
                              </span>
                              <span className="text-xs text-muted-foreground">Total registros</span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                            {pieChartData.map((item) => {
                              const share = pieTotal > 0 ? (item.value / pieTotal) * 100 : 0;
                              return (
                                <span key={item.name} className="inline-flex items-center gap-1.5">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: item.fill }}
                                  />
                                  {item.name}
                                  <span>
                                    {formatCount(item.value)} {item.value === 1 ? "unidad" : "unidades"} ({share.toLocaleString("es-MX", { maximumFractionDigits: 1 })}%)
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                          No hay datos de conteos para mostrar
                        </p>
                      )}
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