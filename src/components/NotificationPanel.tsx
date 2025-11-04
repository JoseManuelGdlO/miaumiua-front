import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { notificationsService, Notification } from "@/services/notificationsService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Package, 
  AlertTriangle, 
  Tag, 
  Route, 
  X, 
  Clock,
  MapPin,
  TrendingDown,
  MessageCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const NotificationPanel = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Cargar notificaciones recientes del backend
  useEffect(() => {
    loadNotifications();
    
    // Recargar cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const recentNotifications = await notificationsService.getMappedRecentNotifications(10);
      setNotifications(recentNotifications);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      // En caso de error, mantener las notificaciones actuales
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'stock':
        return <Package className="h-4 w-4" />;
      case 'order':
        return <AlertTriangle className="h-4 w-4" />;
      case 'promotion':
        return <Tag className="h-4 w-4" />;
      case 'route':
        return <Route className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'conversation':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'stock':
        return 'text-warning';
      case 'order':
        return 'text-primary';
      case 'promotion':
        return 'text-success';
      case 'route':
        return 'text-accent-foreground';
      case 'error':
        return 'text-destructive';
      case 'conversation':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(parseInt(id));
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await notificationsService.deleteNotification(parseInt(id));
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        sideOffset={5}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={markAllAsRead}
            >
              Marcar todas leídas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm">Cargando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <Card 
                    className={cn(
                      "mb-2 cursor-pointer transition-colors hover:bg-accent/50",
                      !notification.read && "bg-primary/5 border-primary/20"
                    )}
                    onClick={() => {
                      markAsRead(notification.id);
                      setOpen(false);
                      if (notification.actionUrl) {
                        navigate(notification.actionUrl);
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-0.5", getTypeColor(notification.type))}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={cn(
                              "text-sm font-medium truncate",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(notification.timestamp)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                notification.priority === 'urgent' ? 'bg-red-600' :
                                notification.priority === 'high' ? 'bg-destructive' :
                                notification.priority === 'medium' ? 'bg-warning' : 'bg-success'
                              )} />
                              <span className={cn(
                                "text-xs capitalize",
                                getPriorityColor(notification.priority)
                              )}>
                                {notification.priority === 'urgent' ? 'Urgente' :
                                 notification.priority === 'high' ? 'Alta' :
                                 notification.priority === 'medium' ? 'Media' : 'Baja'}
                              </span>
                            </div>
                            
                            {!notification.read && (
                              <div className="h-2 w-2 bg-primary rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3">
          <Button 
            variant="outline" 
            className="w-full" 
            size="sm"
            onClick={() => {
              setOpen(false);
              navigate('/dashboard/notifications');
            }}
          >
            <Bell className="h-4 w-4 mr-2" />
            Ver todas las notificaciones
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPanel;