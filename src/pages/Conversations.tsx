import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Plus, Search, Filter, MoreVertical, AlertTriangle, XCircle, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ErrorDetailsModal from "@/components/ErrorDetailsModal";

const Conversations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const conversations = [
    {
      id: 1,
      customer: "María González",
      avatar: "",
      lastMessage: "¿Cuándo llegará mi pedido?",
      timestamp: "hace 2 minutos",
      status: "error",
      unread: 3,
      agent: "Bot Assistant",
      errorDetails: "Error 500: Timeout en API externa. El servicio de pagos no respondió después de 30 segundos.",
      failureReason: "API de pagos no disponible",
      errorCode: "PAYMENT_SERVICE_TIMEOUT"
    },
    {
      id: 2,
      customer: "Carlos López",
      avatar: "",
      lastMessage: "Esto es inaceptable, quiero una solución YA!",
      timestamp: "hace 15 minutos",
      status: "escalado",
      unread: 0,
      agent: "Ana Martínez",
      escalationReason: "Cliente insatisfecho - Requiere atención urgente"
    },
    {
      id: 3,
      customer: "Laura Rodríguez",
      avatar: "",
      lastMessage: "Necesito cambiar mi dirección",
      timestamp: "hace 1 hora",
      status: "pendiente",
      unread: 1,
      agent: "Bot Assistant"
    },
    {
      id: 4,
      customer: "Pedro Sánchez",
      avatar: "",
      lastMessage: "El producto llegó en perfectas condiciones",
      timestamp: "hace 2 horas",
      status: "resuelto",
      unread: 0,
      agent: "Carlos Morales"
    },
    {
      id: 5,
      customer: "Ana García",
      avatar: "",
      lastMessage: "¿Tienen descuentos disponibles?",
      timestamp: "hace 3 horas",
      status: "activo",
      unread: 2,
      agent: "Bot Assistant"
    }
  ];

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
      default:
        return "outline";
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      title: "Conversaciones Activas",
      value: conversations.filter(c => c.status === "activo").length,
      icon: MessageCircle,
      color: "text-green-600"
    },
    {
      title: "Con Errores",
      value: conversations.filter(c => c.status === "error").length,
      icon: XCircle,
      color: "text-red-600"
    },
    {
      title: "Escaladas",
      value: conversations.filter(c => c.status === "escalado").length,
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      title: "Resueltas Hoy",
      value: conversations.filter(c => c.status === "resuelto").length,
      icon: MessageCircle,
      color: "text-gray-600"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conversaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las conversaciones con tus clientes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Conversación
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Conversaciones</CardTitle>
          <CardDescription>
            {filteredConversations.length} conversaciones encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={conversation.avatar} />
                      <AvatarFallback>
                        {conversation.customer.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(conversation.status)} rounded-full border-2 border-background`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conversation.customer}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conversation.timestamp}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusBadge(conversation.status)} className="text-xs">
                        {conversation.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Agente: {conversation.agent}
                      </span>
                      {(conversation.status === "error" || conversation.status === "escalado") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2 text-destructive hover:text-destructive"
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
                      <DropdownMenuItem>Ver conversación</DropdownMenuItem>
                      <DropdownMenuItem>Asignar agente</DropdownMenuItem>
                      <DropdownMenuItem>Marcar como resuelto</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Archivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default Conversations;