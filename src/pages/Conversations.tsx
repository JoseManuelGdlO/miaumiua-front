import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Search, Filter, MoreVertical, AlertTriangle, XCircle, Info, Tag, X, Flag } from "lucide-react";
import { canChangeConversationStatus } from "@/utils/permissions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import ErrorDetailsModal from "@/components/ErrorDetailsModal";
import AssignFlagsModal from "@/components/modals/AssignFlagsModal";
import FlagsSelector from "@/components/FlagsSelector";
import { conversationsService } from "@/services/conversationsService";
import { useToast } from "@/hooks/use-toast";
import {
  buildListQueryParams,
  buildListScopeParams,
  type ConversationListFilter,
  CONVERSATION_LIST_FILTER_OPTIONS,
  fetchConversationKpiStats,
  getListFilterLabel,
} from "@/utils/conversationListFilters";
import { cn } from "@/lib/utils";

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

const mapConversationFromApi = (c: any) => {
  const chats = Array.isArray(c.chats) ? c.chats : [];
  const lastChat = chats.length > 0 ? chats[chats.length - 1] : null;
  const unreadCount = chats.filter((chat: any) => chat?.leido === false).length;
  const phoneNumberRaw = c?.from || "";
  const phoneNumber = getPhoneDisplay(phoneNumberRaw);

  let customerName = "";
  if (c?.cliente?.nombre_completo) {
    customerName = c.cliente.nombre_completo.replace(/usuairo/gi, "usuario");
  } else if (phoneNumber && phoneNumber !== phoneNumberRaw) {
    customerName = phoneNumber;
  } else if (
    c?.from &&
    !c.from.toLowerCase().includes("cliente nuevo") &&
    !c.from.toLowerCase().includes("nuevo cliente")
  ) {
    customerName = c.from;
  } else {
    customerName = `Conversación #${c.id}`;
  }

  const logs = Array.isArray(c.logs) ? c.logs : [];
  const errorLog = logs.find(
    (l: any) => l?.tipo_log === "error" || l?.nivel === "error"
  );
  const hasErrorLog = Boolean(errorLog);
  const hasEscalationLog = logs.some((l: any) => l?.tipo_log === "escalacion");
  const rawStatus = c.status || "activa";
  const displayStatus = hasErrorLog
    ? "error"
    : hasEscalationLog
      ? "escalado"
      : rawStatus;
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
    rawStatus,
    status: displayStatus,
    unread: unreadCount,
    agent: c?.agente?.nombre || "Bot Assistant",
    errorDetails: hasErrorLog
      ? errorLog?.descripcion || "Error en la conversación"
      : undefined,
    phoneNumber,
    flags,
    hasErrorLog,
    hasEscalationLog,
  };
};

const Conversations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [listFilter, setListFilter] = useState<ConversationListFilter>("all");
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
  const [totalCount, setTotalCount] = useState<number>(0);
  const [limit] = useState<number>(20);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const scope = buildListScopeParams(searchTerm, selectedFlags);
      const useScopedKpis =
        listFilter !== "all" || Boolean(scope.search || scope.flags);

      const [listRes, kpiCounts] = await Promise.all([
        conversationsService.getConversations({
          page,
          limit,
          ...scope,
          ...buildListQueryParams(listFilter),
        }),
        useScopedKpis
          ? fetchConversationKpiStats(scope)
          : conversationsService
              .getStats()
              .then((res) => res?.data ?? {}),
      ]);

      const mapped = (listRes?.data?.conversaciones || []).map(mapConversationFromApi);

      setConversations(mapped);
      setStatsData(kpiCounts);
      setTotalPages(listRes?.data?.pagination?.totalPages || 1);
      setTotalCount(listRes?.data?.pagination?.total ?? mapped.length);
    } catch (e: any) {
      setError(e?.message || "Error al cargar conversaciones");
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedFlags, searchTerm, listFilter]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleListFilterChange = (value: ConversationListFilter) => {
    setListFilter(value);
    setPage(1);
  };

  const handleKpiClick = (filterKey: ConversationListFilter) => {
    setListFilter((current) => (current === filterKey ? "all" : filterKey));
    setPage(1);
  };

  const activeFiltersCount =
    (listFilter !== "all" ? 1 : 0) + selectedFlags.length;

  const clearAllFilters = () => {
    setListFilter("all");
    setSelectedFlags([]);
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
      case "activa":
        return "bg-green-500";
      case "cerrada":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      case "escalado":
        return "bg-orange-500";
      case "pausada":
        return "bg-blue-500";
      case "en_espera":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "activo":
      case "activa":
        return "default";
      case "cerrada":
        return "outline";
      case "error":
        return "destructive";
      case "escalado":
        return "secondary";
      case "pausada":
      case "en_espera":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handlePauseConversation = async (conversationId: number) => {
    try {
      await conversationsService.updateConversationStatus(conversationId, "pausada");
      await loadConversations();

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
      await loadConversations();

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

  const handleMarkAsResolved = async (conversationId: number) => {
    try {
      await conversationsService.updateConversationStatus(conversationId, "cerrada");
      await loadConversations();
      toast({
        title: "Éxito",
        description: "Conversación marcada como resuelta",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar la conversación como resuelta",
        variant: "destructive",
      });
    }
  };

  const stats = [
    {
      title: "Conversaciones Activas",
      filterKey: "activa" as ConversationListFilter,
      value:
        statsData.activas ??
        statsData.conversacionesActivas ??
        0,
      icon: MessageCircle,
      color: "text-green-600",
    },
    {
      title: "Con Errores",
      filterKey: "error" as ConversationListFilter,
      value: statsData.errores ?? 0,
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Escaladas",
      filterKey: "escalado" as ConversationListFilter,
      value: statsData.escaladas ?? 0,
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Resueltas",
      filterKey: "cerrada" as ConversationListFilter,
      value:
        statsData.cerradas ??
        statsData.resueltas_hoy ??
        statsData.conversacionesCerradas ??
        0,
      icon: MessageCircle,
      color: "text-gray-600",
    },
  ];

  const erroresCount = statsData.errores ?? 0;
  const escaladasCount = statsData.escaladas ?? 0;

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
        {stats.map((stat) => (
          <Card
            key={stat.filterKey}
            role="button"
            tabIndex={0}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              listFilter === stat.filterKey && "ring-2 ring-primary"
            )}
            onClick={() => handleKpiClick(stat.filterKey)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleKpiClick(stat.filterKey);
              }
            }}
          >
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
      {(erroresCount > 0 || escaladasCount > 0) && (
        <Alert className="border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Hay {erroresCount} conversaciones con errores y{" "}
            {escaladasCount} escaladas que requieren atención inmediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
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
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros de Conversaciones</SheetTitle>
              <SheetDescription>
                Filtra por estado y flags
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select
                  value={listFilter}
                  onValueChange={(value) =>
                    handleListFilterChange(value as ConversationListFilter)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONVERSATION_LIST_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Flags</label>
                <FlagsSelector
                  value={selectedFlags}
                  onValueChange={(ids) => {
                    setSelectedFlags(ids);
                    setPage(1);
                  }}
                  placeholder="Seleccionar flags para filtrar..."
                />
              </div>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {(listFilter !== "all" || selectedFlags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {listFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Estado: {getListFilterLabel(listFilter)}
              <button
                type="button"
                className="ml-1 rounded-full hover:bg-muted p-0.5"
                onClick={() => handleListFilterChange("all")}
                aria-label="Quitar filtro de estado"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedFlags.length > 0 && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {selectedFlags.length} flag{selectedFlags.length > 1 ? "s" : ""}
              <button
                type="button"
                className="ml-1 rounded-full hover:bg-muted p-0.5"
                onClick={() => {
                  setSelectedFlags([]);
                  setPage(1);
                }}
                aria-label="Quitar filtro de flags"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
      </div>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Conversaciones</CardTitle>
          <CardDescription>
            {loading
              ? "Cargando..."
              : `${totalCount} conversaciones encontradas`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-destructive/20 bg-destructive/5">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {conversations.map((conversation) => (
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
                      {(conversation.hasErrorLog ||
                        conversation.hasEscalationLog ||
                        conversation.status === "error" ||
                        conversation.status === "escalado") && (
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsResolved(conversation.id);
                          }}
                        >
                          Marcar como resuelto
                        </DropdownMenuItem>
                      )}
                      {conversation.rawStatus === "pausada" ? (
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
            loadConversations();
          }}
        />
      )}
    </div>
  );
};

export default Conversations;