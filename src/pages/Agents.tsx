import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Bot, Workflow, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
  description: string;
  context: string;
  systemPrompt: string;
  enabled: boolean;
  color: string;
}

const initialAgents: Agent[] = [
  {
    id: "reception",
    name: "Agente de Recepción",
    description: "Maneja la recepción inicial de llamadas y consultas de clientes",
    context: "Eres un agente especializado en recepción de llamadas para Miau Miau. Tu función es recibir a los clientes de manera amigable y profesional, identificar sus necesidades y dirigirlos al siguiente paso del proceso.",
    systemPrompt: "Saluda cordialmente, identifica el tipo de consulta (pedido de arena, información de productos, seguimiento de pedido), recopila información básica del cliente y pasa al siguiente agente apropiado.",
    enabled: true,
    color: "bg-blue-500"
  },
  {
    id: "data_extraction",
    name: "Agente de Extracción de Datos",
    description: "Extrae y valida información relevante del cliente",
    context: "Especialista en recopilar información precisa de clientes. Extraes datos como ubicación, tipo de arena necesaria, cantidad, fecha de entrega preferida y detalles de contacto.",
    systemPrompt: "Recopila información detallada: dirección completa, tipo de arena (fina, gruesa, especial), cantidad en bultos, fecha preferida de entrega, número de contacto, y cualquier instrucción especial de entrega.",
    enabled: true,
    color: "bg-green-500"
  },
  {
    id: "availability_check",
    name: "Agente de Verificación de Disponibilidad",
    description: "Verifica stock y disponibilidad de productos y rutas de entrega",
    context: "Agente encargado de verificar disponibilidad de productos en inventario y capacidad de entrega en la zona solicitada. Consultas el sistema de inventario y rutas disponibles.",
    systemPrompt: "Verifica: stock disponible del tipo de arena solicitada, capacidad de entrega en la zona del cliente, disponibilidad de repartidores para la fecha solicitada, y calcula tiempo estimado de entrega.",
    enabled: true,
    color: "bg-yellow-500"
  },
  {
    id: "confirmation",
    name: "Agente de Confirmación",
    description: "Confirma detalles del pedido y método de pago con el cliente",
    context: "Especialista en confirmación de pedidos. Presentas un resumen completo del pedido, confirmas todos los detalles con el cliente y gestionas la información de pago.",
    systemPrompt: "Presenta resumen completo: productos, cantidad, dirección de entrega, fecha, costo total, método de pago preferido. Confirma cada detalle con el cliente y solicita confirmación final antes de proceder.",
    enabled: true,
    color: "bg-purple-500"
  },
  {
    id: "appointment_creation",
    name: "Agente de Creación de Citas",
    description: "Crea y programa la cita de entrega final",
    context: "Agente final que programa oficialmente la entrega. Creas el pedido en el sistema, asignas ruta de entrega, y proporcionas número de seguimiento al cliente.",
    systemPrompt: "Crea el pedido oficial, asigna número de orden, programa en sistema de rutas, asigna repartidor disponible, genera número de seguimiento, y envía confirmación final con todos los detalles al cliente.",
    enabled: true,
    color: "bg-red-500"
  }
];

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [activeAgent, setActiveAgent] = useState<string>("reception");
  const { toast } = useToast();

  const handleSaveAgent = (agentId: string, updatedData: Partial<Agent>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, ...updatedData } : agent
    ));
    
    toast({
      title: "✅ Agente Actualizado",
      description: "Los cambios han sido guardados correctamente.",
    });
  };

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, enabled: !agent.enabled } : agent
    ));
  };

  const currentAgent = agents.find(agent => agent.id === activeAgent);

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
                Flujo: Recepción → Extracción → Disponibilidad → Confirmación → Creación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {agents.map((agent, index) => (
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
                      <div className={`w-3 h-3 rounded-full ${agent.color}`} />
                      <div>
                        <p className="font-medium text-sm">{index + 1}. {agent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {agent.id}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={agent.enabled ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {agent.enabled ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Configuración del Agente Seleccionado */}
        <div className="lg:col-span-2">
          {currentAgent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${currentAgent.color}`} />
                    <div>
                      <CardTitle>{currentAgent.name}</CardTitle>
                      <CardDescription>{currentAgent.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant={currentAgent.enabled ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleAgent(currentAgent.id)}
                  >
                    {currentAgent.enabled ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="context" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="context">Contexto</TabsTrigger>
                    <TabsTrigger value="prompt">System Prompt</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="context" className="space-y-4">
                    <div>
                      <Label htmlFor="context">Contexto del Agente</Label>
                      <Textarea
                        id="context"
                        value={currentAgent.context}
                        onChange={(e) => handleSaveAgent(currentAgent.id, { context: e.target.value })}
                        rows={8}
                        className="mt-2"
                        placeholder="Describe el rol y responsabilidades de este agente..."
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="prompt" className="space-y-4">
                    <div>
                      <Label htmlFor="systemPrompt">System Prompt</Label>
                      <Textarea
                        id="systemPrompt"
                        value={currentAgent.systemPrompt}
                        onChange={(e) => handleSaveAgent(currentAgent.id, { systemPrompt: e.target.value })}
                        rows={8}
                        className="mt-2"
                        placeholder="Instrucciones específicas para el comportamiento del agente..."
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => toast({
                      title: "✅ Configuración Guardada",
                      description: `Configuración del agente ${currentAgent.name} actualizada.`,
                    })}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Información del Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Información del Workflow LangGraph
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {agents.map((agent, index) => (
              <div key={agent.id} className="text-center">
                <div className={`w-12 h-12 mx-auto rounded-full ${agent.color} flex items-center justify-center mb-2`}>
                  <span className="text-white font-bold">{index + 1}</span>
                </div>
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{agent.id}</p>
                {index < agents.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-4 text-center">
                    <span className="text-muted-foreground">→</span>
                  </div>
                )}
              </div>
            ))}
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
    </div>
  );
}