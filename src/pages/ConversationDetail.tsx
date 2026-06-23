import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { conversationsService, resolveChatImageUrl } from "@/services/conversationsService";
import { conversationLogsService, type ConversacionLogEntry } from "@/services/conversationLogsService";
import { canChangeConversationStatus, hasPermission } from "@/utils/permissions";
import {
	getLogDetailRows,
	getLogTimestamp,
	getLogTypeLabel,
	isLogError,
	sortLogsDesc,
} from "@/utils/formatConversationLog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import WhatsAppMessageStatus from "@/components/WhatsAppMessageStatus";
import { ImagePlus } from "lucide-react";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ConversationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const skipNextScrollRef = useRef<boolean>(false);
  const [chatPage, setChatPage] = useState<number>(1);
  const [chatTotalPages, setChatTotalPages] = useState<number>(1);
  const [loadingChats, setLoadingChats] = useState<boolean>(false);
  const [loadingOlder, setLoadingOlder] = useState<boolean>(false);
  const [logs, setLogs] = useState<ConversacionLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsLoaded, setLogsLoaded] = useState<boolean>(false);
  const [accordionValue, setAccordionValue] = useState<string[]>([]);
  const initialPedidoOpenRef = useRef<boolean>(false);
  const chatLimit = 10;
  const canViewLogs = hasPermission("ver_conversaciones_logs");

  const fetchDetail = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!id) return;
    if (!options.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await conversationsService.getConversationById(id);
      setConversation(res?.data?.conversacion || null);
    } catch (e: any) {
      if (!options.silent) {
        setError(e?.message || 'Error al cargar la conversación');
      }
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchDetail({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchDetail]);

  const isPaused = conversation?.status === "pausada";
  const canTogglePause =
    conversation?.status === "activa" || conversation?.status === "pausada";
  const conversationId = Number(id);

  const handleToggleConversationStatus = async (shouldBeActive: boolean) => {
    if (!id || Number.isNaN(conversationId) || !conversation) return;

    const previousStatus = conversation.status;
    const nextStatus = shouldBeActive ? "activa" : "pausada";
    setConversation((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    setUpdatingStatus(true);
    try {
      await conversationsService.updateConversationStatus(conversationId, nextStatus);
      const res = await conversationsService.getConversationById(id);
      setConversation(res?.data?.conversacion || null);
      toast({
        title: "Éxito",
        description: shouldBeActive
          ? `Conversación con id ${conversationId} se ha activado`
          : `Conversación con id ${conversationId} se ha pausado`,
      });
    } catch (e: any) {
      setConversation((prev) => (prev ? { ...prev, status: previousStatus } : prev));
      toast({
        title: "Error",
        description:
          e?.message ||
          (shouldBeActive
            ? `La conversación con id ${conversationId} no se ha podido activar`
            : `La conversación con id ${conversationId} no se ha podido pausar`),
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const loadChats = async (pageToLoad: number, options: { prepend?: boolean } = {}) => {
    if (!id) return;
    setLoadingChats(true);
    if (options.prepend) {
      setLoadingOlder(true);
    }
    try {
      const res = await conversationsService.getConversationChats(id, pageToLoad, chatLimit);
      const items = Array.isArray(res?.data?.chats) ? res.data.chats : [];
      const ordered = items.slice().reverse();
      setChats((prev) => (options.prepend ? [...ordered, ...prev] : ordered));
      setChatTotalPages(res?.data?.pagination?.totalPages || 1);
      setChatPage(pageToLoad);
    } catch (e: any) {
      setSendError(e?.message || 'Error al cargar los mensajes');
    } finally {
      setLoadingChats(false);
      setLoadingOlder(false);
      if (options.prepend) {
        skipNextScrollRef.current = true;
      }
    }
  };

  const loadLogs = useCallback(async () => {
    if (!id || !canViewLogs) return;
    setLoadingLogs(true);
    setLogsError(null);
    try {
      const res = await conversationLogsService.getLogsByConversacion(id);
      const items = Array.isArray(res?.data?.logs) ? res.data.logs : [];
      setLogs(sortLogsDesc(items));
      setLogsLoaded(true);
    } catch (e: any) {
      setLogsError(e?.message || "Error al cargar logs");
    } finally {
      setLoadingLogs(false);
    }
  }, [id, canViewLogs]);

  const handleAccordionChange = (values: string[]) => {
    setAccordionValue(values);
    if (values.includes("logs") && !logsLoaded && !loadingLogs) {
      loadLogs();
    }
  };

  const pedido = conversation?.pedido || null;
  const productos = Array.isArray(pedido?.productos) ? pedido.productos : [];
  const lastChatId = chats.length > 0 ? chats[chats.length - 1]?.id : null;

  useEffect(() => {
    setLogs([]);
    setLogsLoaded(false);
    setLogsError(null);
    setAccordionValue([]);
    initialPedidoOpenRef.current = false;
  }, [id]);

  useEffect(() => {
    const hasPedido = Boolean(conversation?.id_pedido || conversation?.pedido);
    if (!initialPedidoOpenRef.current && hasPedido) {
      setAccordionValue((prev) => (prev.includes("pedido") ? prev : [...prev, "pedido"]));
      initialPedidoOpenRef.current = true;
    }
  }, [conversation?.id_pedido, conversation?.pedido]);

  useEffect(() => {
    if (!loadingChats && !loadingOlder) {
      if (skipNextScrollRef.current) {
        skipNextScrollRef.current = false;
        return;
      }
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lastChatId, loadingChats, loadingOlder]);

  useEffect(() => {
    if (!id) return;
    setChats([]);
    setChatPage(1);
    setChatTotalPages(1);
    loadChats(1);
  }, [id]);

  useEffect(() => {
    if (!id || chatPage !== 1) return;
    const interval = setInterval(() => {
      loadChats(1);
    }, 120000);
    return () => clearInterval(interval);
  }, [id, chatPage]);

  const handleSendMessage = async () => {
    if (!id) return;
    const message = newMessage.trim();
    if (!message) {
      setSendError('Escribe un mensaje antes de enviar.');
      return;
    }

    setSending(true);
    setSendError(null);
    try {
      const res = await conversationsService.sendWhatsAppMessage(id, message);
      const chat = res?.data?.chat;
      if (chat) {
        setChats((prev) => [...prev, chat]);
      }
      setNewMessage('');

      if (res?.data?.template_used && res?.data?.operator_whatsapp_text_sent === false) {
        toast({
          title: 'Plantilla de apertura enviada',
          description:
            'Tu mensaje quedó en el historial del panel. El cliente debe contestar primero en WhatsApp para poder recibir ese texto por el chat.',
        });
      } else {
        toast({
          title: 'Enviado',
          description: 'Tu mensaje se envió por WhatsApp.',
        });
      }
    } catch (e: any) {
      setSendError(e?.message || 'Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSendError(null);

    if (!file) {
      clearImageSelection();
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSendError('Solo se permiten imágenes JPG, PNG o WEBP.');
      clearImageSelection();
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setSendError('La imagen no debe superar 5 MB.');
      clearImageSelection();
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleSendImage = async () => {
    if (!id || !imageFile) return;

    setSending(true);
    setSendError(null);
    try {
      const res = await conversationsService.sendWhatsAppImage(id, imageFile, newMessage.trim() || undefined);
      const chat = res?.data?.chat;
      if (chat) {
        setChats((prev) => [...prev, chat]);
      }
      setNewMessage('');
      clearImageSelection();
    } catch (e: any) {
      setSendError(e?.message || 'Error al enviar la imagen');
    } finally {
      setSending(false);
    }
  };

  // Guard: require base permission to view conversation detail
  if (!hasPermission("ver_conversaciones")) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription className="text-destructive">No tienes permisos para ver conversaciones.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detalle de Conversación</h1>
          <p className="text-muted-foreground">ID: {id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      {/* Detalle del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
          <CardDescription>Información del cliente y canal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div>
              <div className="text-muted-foreground">Nombre</div>
              <div className="font-medium">{conversation?.cliente?.nombre_completo || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Teléfono</div>
              <div className="font-medium">{conversation?.cliente?.telefono || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Email</div>
              <div className="font-medium break-all">{conversation?.cliente?.email || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Estado</div>
              <div className="font-medium capitalize">{conversation?.status || '—'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acordeones superiores: Pedido y Logs */}
      <Accordion
        type="multiple"
        className="space-y-2"
        value={accordionValue}
        onValueChange={handleAccordionChange}
      >
        <AccordionItem value="pedido">
          <AccordionTrigger>Detalles del pedido</AccordionTrigger>
          <AccordionContent>
            {!pedido ? (
              <div className="text-sm text-muted-foreground">Esta conversación no tiene un pedido asociado.</div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <div className="text-muted-foreground">Número</div>
                    <div className="font-medium break-all">{pedido.numero_pedido || '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Estado</div>
                    <div className="font-medium capitalize">{pedido.estado || '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-medium">{pedido.total}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Método de pago</div>
                    <div className="font-medium capitalize">{pedido.metodo_pago || '—'}</div>
                  </div>
                  <div className="lg:col-span-2">
                    <div className="text-muted-foreground">Dirección de entrega</div>
                    <div className="font-medium break-words">{pedido.direccion_entrega || '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fecha pedido</div>
                    <div className="font-medium">{pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Entrega estimada</div>
                    <div className="font-medium">{pedido.fecha_entrega_estimada ? new Date(pedido.fecha_entrega_estimada).toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Entrega real</div>
                    <div className="font-medium">{pedido.fecha_entrega_real ? new Date(pedido.fecha_entrega_real).toLocaleString() : '—'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground mb-2">Productos</div>
                  {productos.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Sin productos</div>
                  ) : (
                    <div className="border rounded">
                      <div className="grid grid-cols-6 gap-2 p-2 text-xs text-muted-foreground border-b">
                        <div className="col-span-2">Producto</div>
                        <div>Cant.</div>
                        <div>Precio</div>
                        <div>Total</div>
                        <div>Notas</div>
                      </div>
                      {productos.map((p: any) => (
                        <div key={p.id} className="grid grid-cols-6 gap-2 p-2 text-xs border-b last:border-b-0">
                          <div className="col-span-2 truncate" title={p?.producto?.nombre}>{p?.producto?.nombre || `#${p.fkid_producto}`}</div>
                          <div>{p.cantidad}</div>
                          <div>{p.precio_unidad}</div>
                          <div>{p.precio_total || (Number(p.precio_unidad || 0) * Number(p.cantidad || 0)).toFixed(2)}</div>
                          <div className="truncate" title={p.notas_producto || ''}>{p.notas_producto || '—'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {canViewLogs && (
          <AccordionItem value="logs">
            <AccordionTrigger>Ver logs</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-80 overflow-auto pr-1">
                {loadingLogs && <div className="text-xs text-muted-foreground">Cargando logs...</div>}
                {logsError && <div className="text-xs text-destructive">{logsError}</div>}
                {!loadingLogs && !logsError && logs.length === 0 && (
                  <div className="text-xs text-muted-foreground">Sin logs</div>
                )}
                {logs.map((log) => {
                  const timestamp = getLogTimestamp(log);
                  const details = getLogDetailRows(log);
                  const hasError = isLogError(log);

                  return (
                    <div
                      key={log.id}
                      className={`rounded-lg border p-3 ${hasError ? "border-destructive/40 bg-destructive/5" : "bg-muted/30"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={hasError ? "destructive" : "secondary"} className="text-[10px]">
                            {getLogTypeLabel(log.tipo_log)}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {log.nivel}
                          </Badge>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {timestamp ? timestamp.toLocaleString("es-MX") : "—"}
                        </span>
                      </div>
                      {log.descripcion && (
                        <p className={`mt-2 text-sm ${hasError ? "text-destructive" : ""}`}>
                          {log.descripcion}
                        </p>
                      )}
                      {details.length > 0 && (
                        <dl className="mt-2 grid gap-1 border-t border-border/60 pt-2">
                          {details.map((row) => (
                            <div key={`${log.id}-${row.label}`} className="grid grid-cols-[minmax(0,38%)_1fr] gap-2 text-xs">
                              <dt className="text-muted-foreground">{row.label}</dt>
                              <dd className="break-words font-medium">{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Chat al final */}
      {hasPermission("ver_conversaciones_chat") && (
        <Card>
          <CardHeader>
            <CardTitle>Chats</CardTitle>
            <CardDescription>Mensajes de la conversación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loadingChats && <div className="text-sm text-muted-foreground">Cargando chats...</div>}
              {!loadingChats && chats.length === 0 && (
                <div className="text-sm text-muted-foreground">Sin mensajes</div>
              )}
              {chatPage < chatTotalPages && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingOlder}
                    onClick={() => loadChats(chatPage + 1, { prepend: true })}
                  >
                    {loadingOlder ? 'Cargando...' : 'Cargar mensajes anteriores'}
                  </Button>
                </div>
              )}
              {chats.map((chat: any) => {
                const isUser = (chat?.from || '').toLowerCase() === 'usuario';
                const timestamp = chat.created_at ? new Date(chat.created_at).toLocaleString() : `${chat.fecha} ${chat.hora}`;
                const whatsappStatus = chat?.metadata?.whatsapp_status || null;
                const isPendingWhatsAppDelivery = chat?.metadata?.whatsapp_pending_delivery === true;
                const shouldShowStatus = !isUser && whatsappStatus;
                const isImageMessage = chat?.tipo_mensaje === 'imagen';
                const imageUrl = isImageMessage ? resolveChatImageUrl(chat?.metadata?.image_url) : '';
                const showCaption = chat?.mensaje && chat.mensaje !== '[imagen]';
                
                return (
                  <div key={chat.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'} px-1`}>
                    <div className={`relative max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${isUser ? 'bg-gray-200 text-foreground' : 'bg-blue-600 text-white'}`}>
                      {isUser ? (
                        <span
                          className="absolute left-[-6px] bottom-2"
                          style={{
                            width: 0,
                            height: 0,
                            borderTop: '8px solid transparent',
                            borderRight: '8px solid rgb(229 231 235)',
                            borderBottom: '8px solid transparent',
                          }}
                        />
                      ) : (
                        <span
                          className="absolute right-[-6px] bottom-2"
                          style={{
                            width: 0,
                            height: 0,
                            borderTop: '8px solid transparent',
                            borderLeft: '8px solid rgb(37 99 235)',
                            borderBottom: '8px solid transparent',
                          }}
                        />
                      )}
                      {isImageMessage && imageUrl ? (
                        <div className="space-y-2">
                          <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={imageUrl}
                              alt={showCaption ? chat.mensaje : 'Imagen'}
                              className="max-w-full max-h-64 rounded-lg object-contain"
                            />
                          </a>
                          {showCaption && (
                            <div className="text-base whitespace-pre-wrap break-words">{chat.mensaje}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-base whitespace-pre-wrap break-words">{chat.mensaje}</div>
                      )}
                      <div className={`mt-1 flex items-center justify-end gap-1 text-xs ${isUser ? 'text-muted-foreground' : 'text-blue-100'}`}>
                        <span>{timestamp}</span>
                        {!isUser && isPendingWhatsAppDelivery && (
                          <span className="italic opacity-90">Pendiente de envío por WhatsApp</span>
                        )}
                        {shouldShowStatus && (
                          <WhatsAppMessageStatus 
                            status={whatsappStatus} 
                            className={isUser ? '' : 'text-blue-100'}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {(hasPermission("enviar_conversaciones_chat") ||
              (canChangeConversationStatus() && conversation && canTogglePause)) && (
              <div className="mt-4 space-y-2">
                {hasPermission("enviar_conversaciones_chat") && (
                  <>
                    {sendError && (
                      <Alert>
                        <AlertDescription className="text-destructive">{sendError}</AlertDescription>
                      </Alert>
                    )}
                    <Textarea
                      placeholder="Escribe tu mensaje..."
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      rows={3}
                      disabled={sending}
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={sending}
                    />
                    {imagePreview && (
                      <div className="flex items-start gap-3 rounded-md border p-2">
                        <img src={imagePreview} alt="Vista previa" className="h-20 w-20 rounded object-cover border" />
                        <div className="flex-1 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{imageFile?.name}</p>
                          <p>{imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ''}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={clearImageSelection} disabled={sending}>
                          Quitar
                        </Button>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  {canChangeConversationStatus() && conversation && canTogglePause && (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="conversation-status"
                        checked={!isPaused}
                        disabled={updatingStatus || loading || sending}
                        onCheckedChange={handleToggleConversationStatus}
                      />
                      <Label
                        htmlFor="conversation-status"
                        className="cursor-pointer text-sm font-medium whitespace-nowrap"
                      >
                        {isPaused ? "Conversación pausada" : " Conversación activa"}
                      </Label>
                    </div>
                  )}
                  {hasPermission("enviar_conversaciones_chat") && (
                    <div className="ml-auto flex items-center gap-3 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={sending}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Adjuntar imagen
                      </Button>
                      {imageFile && (
                        <Button
                          onClick={handleSendImage}
                          disabled={sending}
                        >
                          {sending ? 'Enviando...' : 'Enviar imagen'}
                        </Button>
                      )}
                      <Button
                        onClick={handleSendMessage}
                        disabled={sending || !newMessage.trim()}
                      >
                        {sending ? 'Enviando...' : 'Enviar mensaje'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConversationDetail;


