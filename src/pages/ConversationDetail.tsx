import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { conversationsService } from "@/services/conversationsService";
import { hasPermission } from "@/utils/permissions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import WhatsAppMessageStatus from "@/components/WhatsAppMessageStatus";

const ConversationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const skipNextScrollRef = useRef<boolean>(false);
  const [chatPage, setChatPage] = useState<number>(1);
  const [chatTotalPages, setChatTotalPages] = useState<number>(1);
  const [loadingChats, setLoadingChats] = useState<boolean>(false);
  const [loadingOlder, setLoadingOlder] = useState<boolean>(false);
  const chatLimit = 10;

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await conversationsService.getConversationById(id);
        setConversation(res?.data?.conversacion || null);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar la conversación');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

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

  const logs = Array.isArray(conversation?.logs) ? conversation.logs : [];
  const pedido = conversation?.pedido || null;
  const productos = Array.isArray(pedido?.productos) ? pedido.productos : [];
  const lastChatId = chats.length > 0 ? chats[chats.length - 1]?.id : null;

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
    } catch (e: any) {
      setSendError(e?.message || 'Error al enviar el mensaje');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detalle de Conversación</h1>
          <p className="text-muted-foreground">ID: {id}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
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
              <div className="text-muted-foreground">Origen</div>
              <div className="font-medium">{conversation?.from || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Estado</div>
              <div className="font-medium capitalize">{conversation?.status || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Actualizado</div>
              <div className="font-medium">{conversation?.updatedAt ? new Date(conversation.updatedAt).toLocaleString() : '—'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acordeones superiores: Pedido y Logs */}
      <Accordion type="multiple" className="space-y-2">
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

        {hasPermission("ver_conversaciones_logs") && (
          <AccordionItem value="logs">
            <AccordionTrigger>Ver logs</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-80 overflow-auto pr-1">
                {loading && <div className="text-xs text-muted-foreground">Cargando logs...</div>}
                {!loading && logs.length === 0 && (
                  <div className="text-xs text-muted-foreground">Sin logs</div>
                )}
                {logs.map((log: any) => (
                  <div key={log.id} className="p-2 border rounded">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className={(log.nivel === 'error' || log.tipo_log === 'error') ? 'text-destructive' : ''}>
                        {log.tipo_log} ({log.nivel})
                      </span>
                      <span>{log.created_at ? new Date(log.created_at).toLocaleString() : `${log.fecha} ${log.hora}`}</span>
                    </div>
                    <div className="mt-1 text-xs">{log.descripcion}</div>
                  </div>
                ))}
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
                // Extraer estado de WhatsApp del metadata
                const whatsappStatus = chat?.metadata?.whatsapp_status || null;
                // Solo mostrar estado para mensajes enviados por agente/bot (no para mensajes del usuario)
                const shouldShowStatus = !isUser && whatsappStatus;
                
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
                      <div className="text-base whitespace-pre-wrap break-words">{chat.mensaje}</div>
                      <div className={`mt-1 flex items-center justify-end gap-1 text-xs ${isUser ? 'text-muted-foreground' : 'text-blue-100'}`}>
                        <span>{timestamp}</span>
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

            {hasPermission("enviar_conversaciones_chat") && (
              <div className="mt-4 space-y-2">
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
                <div className="flex justify-end">
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? 'Enviando...' : 'Enviar mensaje'}
                  </Button>
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


