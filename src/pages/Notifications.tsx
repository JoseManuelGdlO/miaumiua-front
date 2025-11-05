import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { notificationsService, Notification } from "@/services/notificationsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  MessageCircle,
  XCircle,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// La interfaz Notification se importa desde notificationsService

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Mapear filtros del frontend al backend
      const params: any = {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
      };

      // Mapear prioridad del frontend al backend
      if (priorityFilter !== 'all') {
        const priorityMap: Record<string, 'baja' | 'media' | 'alta' | 'urgente'> = {
          'low': 'baja',
          'medium': 'media',
          'high': 'alta',
          'urgent': 'urgente'
        };
        params.prioridad = priorityMap[priorityFilter] || priorityFilter;
      }

      // Mapear filtro de leídas
      if (readFilter === 'read') {
        params.leida = true;
      } else if (readFilter === 'unread') {
        params.leida = false;
      }

      const response = await notificationsService.getMappedNotifications(params);
      setNotifications(response.notifications);
      
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudieron cargar las notificaciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, priorityFilter, readFilter, currentPage, toast]);

  // Cargar notificaciones cuando cambian los filtros
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Actualización automática periódica (respeta los filtros actuales)
  useEffect(() => {
    // Actualizar automáticamente cada 60 segundos
    const interval = setInterval(() => {
      loadNotifications();
    }, 60000); // 60 segundos
    
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // El filtrado ya se hace en el backend, pero podemos mantener un filtro local para el tipo
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    // Filtro por tipo (solo local porque el backend no tiene este campo directamente)
    if (typeFilter !== "all") {
      filtered = filtered.filter(n => n.type === typeFilter);
    }
    
    return filtered;
  }, [notifications, typeFilter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'stock':
        return <Package className="h-5 w-5" />;
      case 'order':
        return <AlertTriangle className="h-5 w-5" />;
      case 'promotion':
        return <Tag className="h-5 w-5" />;
      case 'route':
        return <Route className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'conversation':
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-destructive bg-destructive/10';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'stock':
        return 'text-orange-600 bg-orange-100';
      case 'order':
        return 'text-blue-600 bg-blue-100';
      case 'promotion':
        return 'text-green-600 bg-green-100';
      case 'route':
        return 'text-purple-600 bg-purple-100';
      case 'error':
        return 'text-destructive bg-destructive/10';
      case 'conversation':
        return 'text-cyan-600 bg-cyan-100';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'stock':
        return 'Inventario';
      case 'order':
        return 'Pedido';
      case 'promotion':
        return 'Promoción';
      case 'route':
        return 'Ruta';
      case 'error':
        return 'Error';
      case 'conversation':
        return 'Conversación';
      default:
        return type;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(parseInt(id));
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      toast({
        title: 'Notificación marcada como leída',
        description: 'La notificación ha sido marcada como leída',
      });
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar la notificación como leída',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      toast({
        title: 'Todas las notificaciones marcadas como leídas',
        description: 'Todas las notificaciones han sido marcadas como leídas',
      });
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron marcar todas las notificaciones como leídas',
        variant: 'destructive',
      });
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await notificationsService.deleteNotification(parseInt(id));
      setNotifications(prev => prev.filter(n => n.id !== id));
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
      toast({
        title: 'Notificación eliminada',
        description: 'La notificación ha sido eliminada exitosamente',
      });
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la notificación',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setNotificationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    
    const days = Math.floor(diffInMinutes / 1440);
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notificaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 
                ? `${unreadCount} ${unreadCount === 1 ? 'notificación no leída' : 'notificaciones no leídas'}`
                : 'Todas las notificaciones están leídas'}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notificaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="stock">Inventario</SelectItem>
                <SelectItem value="order">Pedido</SelectItem>
                <SelectItem value="promotion">Promoción</SelectItem>
                <SelectItem value="route">Ruta</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="conversation">Conversación</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>

            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">No leídas</SelectItem>
                <SelectItem value="read">Leídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredNotifications.length === 0 
              ? 'No hay notificaciones' 
              : `${filteredNotifications.length} ${filteredNotifications.length === 1 ? 'notificación' : 'notificaciones'}`
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Cargando notificaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No se encontraron notificaciones
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-4">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        !notification.read && "bg-primary/5 border-primary/20 ring-1 ring-primary/10"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "p-2 rounded-lg flex-shrink-0",
                            getTypeColor(notification.type)
                          )}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={cn(
                                    "text-lg font-semibold",
                                    !notification.read && "font-bold"
                                  )}>
                                    {notification.title}
                                  </h3>
                                  {!notification.read && (
                                    <div className="h-2 w-2 bg-primary rounded-full" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {notification.message}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(notification.id);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge
                                variant="outline"
                                className={cn(getTypeColor(notification.type))}
                              >
                                {getTypeLabel(notification.type)}
                              </Badge>
                              
                              <Badge
                                variant="outline"
                                className={cn(getPriorityColor(notification.priority))}
                              >
                                {notification.priority === 'urgent' ? 'Urgente' :
                                 notification.priority === 'high' ? 'Alta' :
                                 notification.priority === 'medium' ? 'Media' : 'Baja'}
                              </Badge>
                              
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(notification.timestamp)}
                              </div>
                            </div>

                            {notification.errorDetails && (
                              <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                                <p className="text-xs font-medium text-destructive mb-1">
                                  Detalles del error:
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {notification.errorDetails}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {index < filteredNotifications.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} ({total} notificaciones)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar notificación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La notificación será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => notificationToDelete && removeNotification(notificationToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Notifications;


