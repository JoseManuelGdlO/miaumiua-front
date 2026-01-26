import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Search, Filter, MoreVertical, AlertTriangle, XCircle, Info, Tag, X, Flag } from "lucide-react";
import { canChangeConversationStatus, canAssignConversation } from "@/utils/permissions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import ErrorDetailsModal from "@/components/ErrorDetailsModal";
import AssignFlagsModal from "@/components/modals/AssignFlagsModal";
import FlagsSelector from "@/components/FlagsSelector";
import { conversationsService } from "@/services/conversationsService";
import { useToast } from "@/hooks/use-toast";

const Conversations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFlags, setSelectedFlags] = useState<number[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [assignFlagsModalOpen, setAssignFlagsModalOpen] = useState(false);
  const [selectedConversationForFlags, setSelectedConversationForFlags] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<Record<string, number>>({});
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(20);

  const normalizePhone = (value: string) => value.replace(/\D/g, "");
  const formatPhone = (value: string) => {
    const digits = normalizePhone(value);
    return digits ? `+${digits}` : "";
  };
  const getPhoneDisplay = (value: string) => {
    if (!value) return "";
    if (value.toLowerCase().startsWith("whatsapp:")) {
      return formatPhone(value);
    }
    const digits = normalizePhone(value);
    return digits.length >= 5 ? formatPhone(value) : value;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [listRes, statsRes] = await Promise.all([
          conversationsService.getConversations({ 
            page, 
            limit,
            search: searchTerm.trim() || undefined,
            flags: selectedFlags.length > 0 ? selectedFlags : undefined
          }),
          conversationsService.getStats(),
        ]);

        const mapped = (listRes?.data?.conversaciones || []).map((c: any) => {
          const chats = Array.isArray(c.chats) ? c.chats : [];
          const lastChat = chats.length > 0 ? chats[chats.length - 1] : null;
          const unreadCount = chats.filter((chat: any) => chat?.leido === false).length;
          const phoneNumberRaw = c?.from || '';
          const phoneNumber = getPhoneDisplay(phoneNumberRaw);
          
          // Determinar el nombre del cliente
          let customerName = '';
          if (c?.cliente?.nombre_completo) {
            customerName = c.cliente.nombre_completo.replace(/usuairo/gi, "usuario");
          } else if (phoneNumber && phoneNumber !== phoneNumberRaw) {
            // Si tenemos un teléfono formateado, usarlo
            customerName = phoneNumber;
          } else if (c?.from && !c.from.toLowerCase().includes('cliente nuevo') && !c.from.toLowerCase().includes('nuevo cliente')) {
            // Usar el campo 'from' solo si no contiene "cliente nuevo"
            customerName = c.from;
          } else {
            // Fallback: mostrar ID de conversación
            customerName = `Conversación #${c.id}`;
          }
          const logs = Array.isArray(c.logs) ? c.logs : [];
          const errorLog = logs.find((l: any) => l?.tipo_log === 'error' || l?.nivel === 'error');
          const hasError = Boolean(errorLog);
          const flags = Array.isArray(c.flags) ? c.flags : [];

          return {
            id: c.id,
            customer: customerName,
            avatar: "",
            lastMessage: lastChat?.mensaje || "",
            timestamp: lastChat?.created_at
              ? new Date(lastChat.created_at).toLocaleString()
              : c?.updatedAt
                ? new Date(c.updatedAt).toLocaleString()
                : "",
            status: hasError ? "error" : (c.status || "pendiente"),
            unread: unreadCount,
            agent: c?.agente?.nombre || "Bot Assistant",
            errorDetails: hasError ? (errorLog?.descripcion || "Error en la conversación") : undefined,
            phoneNumber,
            flags,
          };
        });

        setConversations(mapped);
        setStatsData(statsRes?.data || {});
        setTotalPages(listRes?.data?.pagination?.totalPages || 1);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar conversaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit, selectedFlags, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-500";
      case "pendiente":
        return "bg-yellow-500";
      case "resuelto":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      case "escalado":
        return "bg-orange-500";
      case "pausada":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "activo":
        return "default";
      case "pendiente":
        return "secondary";
      case "resuelto":
        return "outline";
      case "error":
        return "destructive";
      case "escalado":
        return "secondary";
      case "pausada":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Ya no necesitamos filtrar localmente, el backend lo hace
  const filteredConversations = conversations;

  const handlePauseConversation = async (conversationId: number) => {
    try {
      await conversationsService.updateConversationStatus(conversationId, "pausada");
      
      // Actualizar estado local
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === conversationId ? { ...conv, status: "pausada" } : conv
        )
      );

      toast({
        title: "Éxito",
        description: `Conversación con id ${conversationId} se ha pausado`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `La conversación con id ${conversationId} no se ha podido pausar`,
        variant: "destructive",
      });
    }
  };

  const handleActivateConversation = async (conversationId: number) => {
    try {
      await conversationsService.updateConversationStatus(conversationId, "activa");
      
      // Actualizar estado local
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === conversationId ? { ...conv, status: "activa" } : conv
        )
      );

      toast({
        title: "Éxito",
        description: `Conversación con id ${conversationId} se ha activado`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `La conversación con id ${conversationId} no se ha podido activar`,
        variant: "destructive",
      });
    }
  };

  const stats = [
    {
      title: "Conversaciones Activas",
      value: statsData.activas ?? conversations.filter(c => c.status === "activo" || c.status === "activa").length,
      icon: MessageCircle,
      color: "text-green-600"
    },
    {
      title: "Con Errores",
      value: statsData.errores ?? conversations.filter(c => c.status === "error").length,
      icon: XCircle,
      color: "text-red-600"
    },
    {
      title: "Escaladas",
      value: statsData.escaladas ?? conversations.filter(c => c.status === "escalado").length,
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      title: "Resueltas Hoy",
      value: statsData.resueltas_hoy ?? conversations.filter(c => c.status === "resuelto").length,
      icon: MessageCircle,
      color: "text-gray-600"
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Conversaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las conversaciones con tus clientes
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/flags')}
        >
          <Flag className="mr-2 h-4 w-4" />
          Gestionar Flags
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Alert */}
      {conversations.some(c => c.status === "error" || c.status === "escalado") && (
        <Alert className="border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Hay {conversations.filter(c => c.status === "error").length} conversaciones con errores y{" "}
            {conversations.filter(c => c.status === "escalado").length} escaladas que requieren atención inmediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Resetear a la primera página cuando se busca
            }}
            className="pl-10"
          />
        </div>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {selectedFlags.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedFlags.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros de Conversaciones</SheetTitle>
              <SheetDescription>
                Filtra las conversaciones por flags
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Flags</label>
                <FlagsSelector
                  value={selectedFlags}
                  onValueChange={setSelectedFlags}
                  placeholder="Seleccionar flags para filtrar..."
                />
              </div>
              {selectedFlags.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedFlags([])}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Conversaciones</CardTitle>
          <CardDescription>
            {loading ? 'Cargando...' : `${filteredConversations.length} conversaciones encontradas`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-destructive/20 bg-destructive/5">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar>
                      <AvatarImage src={conversation.avatar} />
                      <AvatarFallback>
                        {conversation.customer.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(conversation.status)} rounded-full border-2 border-background`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium text-foreground truncate">
                      {conversation.customer}
                    </p>
                    {conversation.phoneNumber && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        Tel: {conversation.phoneNumber}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge 
                        variant={getStatusBadge(conversation.status)} 
                        className={`text-xs flex-shrink-0 ${conversation.status === "pausada" ? "bg-yellow-500 text-white" : ""}`}
                      >
                        {conversation.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        Agente: {conversation.agent}
                      </span>
                      {conversation.flags && conversation.flags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {conversation.flags.map((flag: any) => (
                            <Badge
                              key={flag.id}
                              variant="secondary"
                              className={`text-xs flex items-center gap-1 ${(!flag.activo || flag.baja_logica) ? 'opacity-60 line-through' : ''}`}
                              style={{
                                backgroundColor: `${flag.color}20`,
                                borderColor: flag.color,
                                color: flag.color,
                              }}
                              title={(!flag.activo || flag.baja_logica) ? 'Flag eliminado - Usa "Gestionar flags" para removerlo' : ''}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: flag.color }}
                              />
                              {flag.nombre}
                              {(!flag.activo || flag.baja_logica) && (
                                <span className="ml-1 text-[10px]">(eliminado)</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {(conversation.status === "error" || conversation.status === "escalado") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConversation(conversation);
                            setShowErrorDetails(true);
                          }}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Ver detalles
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-4">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {conversation.timestamp}
                  </p>
                  <div className="flex items-center space-x-3">
                    {conversation.unread > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unread}
                      </Badge>
                    )}
                    
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/conversations/${conversation.id}`)}>Ver conversación</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConversationForFlags(conversation.id);
                          setAssignFlagsModalOpen(true);
                        }}
                      >
                        <Tag className="mr-2 h-4 w-4" />
                        Gestionar flags
                      </DropdownMenuItem>
                      {canChangeConversationStatus() && (
                        <DropdownMenuItem>Marcar como resuelto</DropdownMenuItem>
                      )}
                      {canAssignConversation() && (
                        <DropdownMenuItem>Asignar agente</DropdownMenuItem>
                      )}
                      {conversation.status === "pausada" ? (
                        <DropdownMenuItem 
                          className="text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateConversation(conversation.id);
                          }}
                        >
                          Activar conversación
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handlePauseConversation(conversation.id);
                        }}>
                          Pausar conversación
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive">
                        Archivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={loading || page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <div className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </div>
            <Button
              variant="outline"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Details Modal */}
      {selectedConversation && (
        <ErrorDetailsModal
          open={showErrorDetails}
          onOpenChange={setShowErrorDetails}
          conversation={selectedConversation}
        />
      )}

      {/* Assign Flags Modal */}
      {selectedConversationForFlags && (
        <AssignFlagsModal
          open={assignFlagsModalOpen}
          onOpenChange={(open) => {
            setAssignFlagsModalOpen(open);
            if (!open) {
              setSelectedConversationForFlags(null);
            }
          }}
          conversacionId={selectedConversationForFlags}
          onSuccess={() => {
            // Recargar conversaciones para actualizar flags
            const fetchData = async () => {
              try {
                const listRes = await conversationsService.getConversations({ 
                  page, 
                  limit,
                  search: searchTerm.trim() || undefined,
                  flags: selectedFlags.length > 0 ? selectedFlags : undefined
                });
                const mapped = (listRes?.data?.conversaciones || []).map((c: any) => {
                  const chats = Array.isArray(c.chats) ? c.chats : [];
                  const lastChat = chats.length > 0 ? chats[chats.length - 1] : null;
                  const unreadCount = chats.filter((chat: any) => chat?.leido === false).length;
                  const phoneNumberRaw = c?.from || '';
                  const phoneNumber = getPhoneDisplay(phoneNumberRaw);
                  
                  // Determinar el nombre del cliente
                  let customerName = '';
                  if (c?.cliente?.nombre_completo) {
                    customerName = c.cliente.nombre_completo.replace(/usuairo/gi, "usuario");
                  } else if (phoneNumber && phoneNumber !== phoneNumberRaw) {
                    // Si tenemos un teléfono formateado, usarlo
                    customerName = phoneNumber;
                  } else if (c?.from && !c.from.toLowerCase().includes('cliente nuevo') && !c.from.toLowerCase().includes('nuevo cliente')) {
                    // Usar el campo 'from' solo si no contiene "cliente nuevo"
                    customerName = c.from;
                  } else {
                    // Fallback: mostrar ID de conversación
                    customerName = `Conversación #${c.id}`;
                  }
                  
                  const logs = Array.isArray(c.logs) ? c.logs : [];
                  const errorLog = logs.find((l: any) => l?.tipo_log === 'error' || l?.nivel === 'error');
                  const hasError = Boolean(errorLog);
                  const flags = Array.isArray(c.flags) ? c.flags : [];

                  return {
                    id: c.id,
                    customer: customerName,
                    avatar: "",
                    lastMessage: lastChat?.mensaje || "",
                    timestamp: lastChat?.created_at
                      ? new Date(lastChat.created_at).toLocaleString()
                      : c?.updatedAt
                        ? new Date(c.updatedAt).toLocaleString()
                        : "",
                    status: hasError ? "error" : (c.status || "pendiente"),
                    unread: unreadCount,
                    agent: c?.agente?.nombre || "Bot Assistant",
                    errorDetails: hasError ? (errorLog?.descripcion || "Error en la conversación") : undefined,
                    phoneNumber,
                    flags,
                  };
                });
                setConversations(mapped);
              } catch (e: any) {
                console.error('Error al recargar conversaciones:', e);
              }
            };
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default Conversations;