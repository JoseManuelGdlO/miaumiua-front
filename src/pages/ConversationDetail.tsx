import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { conversationsService } from "@/services/conversationsService";
import { hasPermission } from "@/utils/permissions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ConversationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);

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

  const chats = Array.isArray(conversation?.chats) ? conversation.chats : [];
  const logs = Array.isArray(conversation?.logs) ? conversation.logs : [];
  const pedido = conversation?.pedido || null;
  const productos = Array.isArray(pedido?.productos) ? pedido.productos : [];

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
              {loading && <div className="text-sm text-muted-foreground">Cargando chats...</div>}
              {!loading && chats.length === 0 && (
                <div className="text-sm text-muted-foreground">Sin mensajes</div>
              )}
              {chats.map((chat: any) => {
                const isUser = (chat?.from || '').toLowerCase() === 'usuario';
                const timestamp = chat.created_at ? new Date(chat.created_at).toLocaleString() : `${chat.fecha} ${chat.hora}`;
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
                      <div className={`mt-1 text-xs ${isUser ? 'text-muted-foreground' : 'text-blue-100'} text-right`}>{timestamp}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConversationDetail;


