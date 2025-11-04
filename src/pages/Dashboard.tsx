import { useState, useEffect } from "react";
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
  BarChart3,
  Settings,
  Loader2,
} from "lucide-react";
import { notificationsService } from "@/services/notificationsService";
import { useToast } from "@/hooks/use-toast";

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
  status: string;
  actionUrl?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityFilter, setActivityFilter] = useState<string>("all");

  // Cargar actividades recientes
  useEffect(() => {
    loadRecentActivity();
    
    // Recargar cada 30 segundos
    const interval = setInterval(loadRecentActivity, 30000);
    return () => clearInterval(interval);
  }, [activityFilter]);

  const loadRecentActivity = async () => {
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

      const activities = await notificationsService.getMappedRecentActivity(params);
      
      // Convertir las notificaciones a actividades recientes
      const mappedActivities: RecentActivity[] = activities.map(notif => {
        // Determinar el tipo de actividad basado en el tipo de notificación
        let activityType = notif.title;
        let status = 'activa';
        
        if (notif.type === 'conversation') {
          activityType = 'Nueva conversación';
          status = 'activa';
        } else if (notif.type === 'order') {
          activityType = 'Venta completada';
          status = 'completada';
        } else if (notif.type === 'stock') {
          activityType = 'Inventario bajo';
          status = 'alerta';
        } else if (notif.type === 'error') {
          activityType = 'Error en sistema';
          status = 'alerta';
        }
        
        // Formatear el tiempo relativo
        const formatTime = (timestamp: string) => {
          const now = new Date();
          const activityTime = new Date(timestamp);
          const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
          
          if (diffInMinutes < 1) return 'Hace un momento';
          if (diffInMinutes < 60) return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
          const hours = Math.floor(diffInMinutes / 60);
          if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
          const days = Math.floor(hours / 24);
          return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
        };
        
        return {
          id: notif.id,
          type: activityType,
          description: notif.message,
          time: formatTime(notif.timestamp),
          status: status,
          actionUrl: notif.actionUrl,
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
  };

  const stats = [
    {
      title: "Conversaciones Activas",
      value: "1,234",
      change: "+12%",
      icon: MessageSquare,
      color: "text-primary",
    },
    {
      title: "Clientes Registrados",
      value: "8,967",
      change: "+5.2%",
      icon: Users,
      color: "text-success",
    },
    {
      title: "Ciudades Activas",
      value: "15",
      change: "+2",
      icon: MapPin,
      color: "text-warning",
    },
    {
      title: "Ventas del Mes",
      value: "$45,678",
      change: "+18%",
      icon: ShoppingCart,
      color: "text-primary",
    },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      activa: "bg-primary text-primary-foreground",
      completada: "bg-success text-success-foreground",
      alerta: "bg-warning text-warning-foreground",
      nuevo: "bg-accent text-accent-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-secondary text-secondary-foreground";
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Panel de Control - Miau Miau</h1>
        <p className="text-muted-foreground">
          Gestiona tus bots de WhatsApp, Instagram y Facebook para la venta de arena para gatos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
                <span className="text-success font-medium">{stat.change}</span> desde el mes pasado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
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
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/5">
                <Bot className="h-6 w-6" />
                <span className="text-sm">Configurar Agente</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/5">
                <Package className="h-6 w-6" />
                <span className="text-sm">Gestionar Inventario</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/5">
                <Users className="h-6 w-6" />
                <span className="text-sm">Ver Clientes</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/5">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Reportes</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Rendimiento Mensual
          </CardTitle>
          <CardDescription>
            Métricas de conversaciones, ventas y satisfacción del cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border-2 border-dashed border-primary/20 flex items-center justify-center">
            <div className="text-center space-y-2">
              <BarChart3 className="h-8 w-8 text-primary mx-auto" />
              <p className="text-muted-foreground">Gráfico de rendimiento será implementado aquí</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;