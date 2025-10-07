import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Bot, Workflow, Settings, Plus, MoreHorizontal, Edit, Trash2, Power, PowerOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { agentsService, Agent } from "@/services/agentsService";
import { canCreate, canEdit, canDelete, canActivateAgent, canViewAgentStats } from "@/utils/permissions";

// Colores aleatorios para los agentes
const getAgentColor = (agentId: number): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-lime-500'
  ];
  
  // Usar el ID del agente para generar un índice consistente
  const colorIndex = agentId % colors.length;
  return colors[colorIndex];
};

// Función para obtener el estado del agente
const getAgentStatus = (estado: string): { label: string; variant: "default" | "secondary" | "destructive" } => {
  switch (estado) {
    case 'activo':
      return { label: 'Activo', variant: 'default' };
    case 'inactivo':
      return { label: 'Inactivo', variant: 'secondary' };
    case 'mantenimiento':
      return { label: 'Mantenimiento', variant: 'destructive' };
    default:
      return { label: 'Desconocido', variant: 'secondary' };
  }
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgent, setActiveAgent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Cargar agentes al montar el componente
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await agentsService.getAllAgents({ limit: 100 });
      if (response.success) {
        setAgents(response.data.agentes);
        // Seleccionar el primer agente si no hay ninguno seleccionado
        if (response.data.agentes.length > 0 && !activeAgent) {
          setActiveAgent(response.data.agentes[0].id);
        }
      }
    } catch (error) {
      console.error('Error cargando agentes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los agentes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSaveAgent = async (agentId: number, updatedData: Partial<Agent>) => {
    try {
      setSaving(true);
      const response = await agentsService.updateAgent(agentId, updatedData);
      if (response.success) {
        // Actualizar la lista local
        setAgents(prev => prev.map(agent => 
          agent.id === agentId ? { ...agent, ...updatedData } : agent
        ));
        
        toast({
          title: "✅ Agente Actualizado",
          description: "Los cambios han sido guardados correctamente.",
        });
      }
    } catch (error) {
      console.error('Error actualizando agente:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el agente",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAgent = async (agentId: number) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;

      const newEstado = agent.estado === 'activo' ? 'inactivo' : 'activo';
      const response = await agentsService.changeAgentStatus(agentId, { estado: newEstado });
      
      if (response.success) {
        setAgents(prev => prev.map(agent => 
          agent.id === agentId ? { ...agent, estado: newEstado } : agent
        ));
        
        toast({
          title: "✅ Estado Actualizado",
          description: `Agente ${newEstado === 'activo' ? 'activado' : 'desactivado'} correctamente.`,
        });
      }
    } catch (error) {
      console.error('Error cambiando estado del agente:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del agente",
        variant: "destructive"
      });
    }
  };

  const deleteAgent = async (agentId: number) => {
    try {
      const response = await agentsService.deleteAgent(agentId);
      if (response.success) {
        setAgents(prev => prev.filter(agent => agent.id !== agentId));
        if (activeAgent === agentId) {
          setActiveAgent(null);
        }
        toast({
          title: "✅ Agente Eliminado",
          description: "El agente ha sido eliminado correctamente.",
        });
      }
    } catch (error) {
      console.error('Error eliminando agente:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el agente",
        variant: "destructive"
      });
    }
  };

  const currentAgent = agents.find(agent => agent.id === activeAgent);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando agentes...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contexto de Agentes IA</h1>
          <p className="text-muted-foreground">
            Configuración de agentes LangGraph para el flujo de pedidos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          <Badge variant="outline" className="bg-primary/10">
            LangGraph Workflow
          </Badge>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Agentes */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Agentes del Workflow
              </CardTitle>
              <CardDescription>
                {agents.length} agentes configurados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {agents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay agentes configurados</p>
                </div>
              ) : (
                agents.map((agent, index) => {
                  const status = getAgentStatus(agent.estado);
                  const color = getAgentColor(agent.id);
                  
                  return (
                    <div
                      key={agent.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        activeAgent === agent.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setActiveAgent(agent.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <div>
                            <p className="font-medium text-sm">{index + 1}. {agent.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {agent.especialidad}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={status.variant}
                            className="text-xs"
                          >
                            {status.label}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEdit('agents') && (
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canActivateAgent() && (
                                <DropdownMenuItem onClick={() => toggleAgent(agent.id)}>
                                  {agent.estado === 'activo' ? (
                                    <>
                                      <PowerOff className="h-4 w-4 mr-2" />
                                      Desactivar
                                    </>
                                  ) : (
                                    <>
                                      <Power className="h-4 w-4 mr-2" />
                                      Activar
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              {canDelete('agents') && (
                                <DropdownMenuItem 
                                  onClick={() => deleteAgent(agent.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuración del Agente Seleccionado */}
        <div className="lg:col-span-2">
          {currentAgent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getAgentColor(currentAgent.id)}`} />
                    <div>
                      <CardTitle>{currentAgent.nombre}</CardTitle>
                      <CardDescription>{currentAgent.descripcion}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="context" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="context">Contexto</TabsTrigger>
                    <TabsTrigger value="prompt">System Prompt</TabsTrigger>
                    <TabsTrigger value="config">Configuración</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="context" className="space-y-4">
                    <div>
                      <Label htmlFor="context">Contexto del Agente</Label>
                      <Textarea
                        id="context"
                        value={currentAgent.contexto}
                        onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { contexto: e.target.value })}
                        rows={8}
                        className="mt-2"
                        placeholder="Describe el rol y responsabilidades de este agente..."
                        disabled={!canEdit('agents')}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="prompt" className="space-y-4">
                    <div>
                      <Label htmlFor="systemPrompt">System Prompt</Label>
                      <Textarea
                        id="systemPrompt"
                        value={currentAgent.system_prompt}
                        onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { system_prompt: e.target.value })}
                        rows={8}
                        className="mt-2"
                        placeholder="Instrucciones específicas para el comportamiento del agente..."
                        disabled={!canEdit('agents')}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="config" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nombre">Nombre del Agente</Label>
                        <Input
                          id="nombre"
                          value={currentAgent.nombre}
                          onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { nombre: e.target.value })}
                          className="mt-2"
                          disabled={!canEdit('agents')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="especialidad">Especialidad</Label>
                        <Input
                          id="especialidad"
                          value={currentAgent.especialidad}
                          onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { especialidad: e.target.value })}
                          className="mt-2"
                          disabled={!canEdit('agents')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                          id="descripcion"
                          value={currentAgent.descripcion}
                          onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { descripcion: e.target.value })}
                          rows={3}
                          className="mt-2"
                          disabled={!canEdit('agents')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="orden_prioridad">Orden de Prioridad</Label>
                        <Input
                          id="orden_prioridad"
                          type="number"
                          value={currentAgent.orden_prioridad}
                          onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { orden_prioridad: parseInt(e.target.value) })}
                          className="mt-2"
                          disabled={!canEdit('agents')}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Personalidad</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tono">Tono</Label>
                          <Input
                            id="tono"
                            value={currentAgent.personalidad?.tono || ''}
                            onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { 
                              personalidad: { ...currentAgent.personalidad, tono: e.target.value }
                            })}
                            className="mt-2"
                            disabled={!canEdit('agents')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="estilo">Estilo</Label>
                          <Input
                            id="estilo"
                            value={currentAgent.personalidad?.estilo || ''}
                            onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { 
                              personalidad: { ...currentAgent.personalidad, estilo: e.target.value }
                            })}
                            className="mt-2"
                            disabled={!canEdit('agents')}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Configuración Técnica</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="max_tokens">Max Tokens</Label>
                          <Input
                            id="max_tokens"
                            type="number"
                            value={currentAgent.configuracion?.max_tokens || ''}
                            onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { 
                              configuracion: { ...currentAgent.configuracion, max_tokens: parseInt(e.target.value) }
                            })}
                            className="mt-2"
                            disabled={!canEdit('agents')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="temperature">Temperature</Label>
                          <Input
                            id="temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={currentAgent.configuracion?.temperature || ''}
                            onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { 
                              configuracion: { ...currentAgent.configuracion, temperature: parseFloat(e.target.value) }
                            })}
                            className="mt-2"
                            disabled={!canEdit('agents')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="modelo">Modelo</Label>
                          <Input
                            id="modelo"
                            value={currentAgent.configuracion?.modelo || ''}
                            onChange={(e) => canEdit('agents') && handleSaveAgent(currentAgent.id, { 
                              configuracion: { ...currentAgent.configuracion, modelo: e.target.value }
                            })}
                            className="mt-2"
                            disabled={!canEdit('agents')}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {canEdit('agents') && (
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={() => toast({
                        title: "✅ Configuración Guardada",
                        description: `Configuración del agente ${currentAgent.nombre} actualizada.`,
                      })}
                      className="flex items-center gap-2"
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Selecciona un Agente</h3>
                <p>Elige un agente de la lista para ver y editar su configuración.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Información del Workflow */}
      {agents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Información del Workflow LangGraph
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {agents.map((agent, index) => {
                const color = getAgentColor(agent.id);
                const status = getAgentStatus(agent.estado);
                
                return (
                  <div key={agent.id} className="text-center relative">
                    <div className={`w-12 h-12 mx-auto rounded-full ${color} flex items-center justify-center mb-2`}>
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <p className="text-sm font-medium">{agent.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-1">{agent.especialidad}</p>
                    <Badge 
                      variant={status.variant}
                      className="text-xs mt-1"
                    >
                      {status.label}
                    </Badge>
                    {index < agents.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-full w-4 text-center">
                        <span className="text-muted-foreground">→</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Flujo del Workflow:</strong> Los agentes trabajan secuencialmente utilizando 
                <code className="bg-background px-1 rounded mx-1">workflow.add_conditional_edges()</code>
                para determinar el siguiente paso basado en la respuesta de cada agente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}