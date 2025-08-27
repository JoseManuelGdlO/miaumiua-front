import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, MapPin, Truck, Route } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Order {
  id: number;
  orderNumber: string;
  customer: string;
  address: string;
  zone: string;
  coordinates: { lat: number; lng: number };
  total: number;
  products: string;
}

interface AIRouteOptimizerProps {
  orders: Order[];
  city: string;
  date: string;
  onRoutesGenerated: (routes: { [key: string]: Order[] }) => void;
}

const AIRouteOptimizer: React.FC<AIRouteOptimizerProps> = ({
  orders,
  city,
  date,
  onRoutesGenerated
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] = useState<{
    routes: { [key: string]: Order[] };
    summary: string;
  } | null>(null);

  const optimizeRoutes = async () => {
    if (!apiKey) {
      alert('Por favor ingresa tu API Key de OpenAI');
      return;
    }

    if (orders.length === 0) {
      alert('No hay pedidos para optimizar en esta ciudad/fecha');
      return;
    }

    setIsOptimizing(true);

    try {
      // Preparar datos para OpenAI
      const ordersData = orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        address: order.address,
        zone: order.zone,
        coordinates: order.coordinates,
        value: order.total,
        products: order.products
      }));

      const prompt = `
Eres un experto en logística y optimización de rutas de entrega para una empresa de arena para gatos llamada "Miau Miau".

DATOS DE ENTREGA:
- Ciudad: ${city}
- Fecha: ${date}
- Total de pedidos: ${orders.length}

PEDIDOS A OPTIMIZAR:
${JSON.stringify(ordersData, null, 2)}

RESTRICCIONES:
- Máximo 8 pedidos por ruta (capacidad del vehículo)
- Priorizar eficiencia geográfica (agrupar por zonas cercanas)
- Considerar el valor total por ruta (equilibrar cargas de trabajo)
- Minimizar distancias de viaje

TAREA:
1. Analiza las direcciones y coordenadas
2. Agrupa los pedidos en rutas óptimas (máximo 8 pedidos por ruta)
3. Asigna identificadores de ruta (A, B, C, etc.)
4. Proporciona un resumen de la optimización

RESPUESTA REQUERIDA (JSON):
{
  "routes": {
    "A": [array de IDs de pedidos],
    "B": [array de IDs de pedidos],
    "C": [array de IDs de pedidos]
  },
  "summary": "Explicación breve de la estrategia de optimización utilizada, incluyendo criterios principales y beneficios de la distribución propuesta."
}

Solo responde con JSON válido, sin texto adicional.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en optimización de rutas logísticas. Responde únicamente con JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        throw new Error(`Error de OpenAI: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Parsear respuesta JSON
      const optimizationResult = JSON.parse(aiResponse);
      
      // Convertir IDs a objetos completos de pedidos
      const optimizedRoutes: { [key: string]: Order[] } = {};
      
      Object.keys(optimizationResult.routes).forEach(routeId => {
        optimizedRoutes[routeId] = optimizationResult.routes[routeId]
          .map((orderId: number) => orders.find(order => order.id === orderId))
          .filter(Boolean);
      });

      setLastOptimization({
        routes: optimizedRoutes,
        summary: optimizationResult.summary
      });

      onRoutesGenerated(optimizedRoutes);

    } catch (error) {
      console.error('Error optimizando rutas:', error);
      alert('Error al optimizar rutas. Verifica tu API Key y conexión.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Optimización Inteligente de Rutas
        </CardTitle>
        <CardDescription>
          Usa OpenAI para generar automáticamente las rutas más eficientes para {city}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="openai-key">API Key de OpenAI</Label>
          <Input
            id="openai-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Tu API key se usa solo para esta sesión. Obtén una en{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" className="text-primary hover:underline">
              platform.openai.com
            </a>
          </p>
        </div>

        {/* Optimization Status */}
        <div className="grid grid-cols-2 gap-4 py-3 border rounded-lg bg-card/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{orders.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Pedidos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span className="font-medium">{Math.ceil(orders.length / 8)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Rutas Estimadas</p>
          </div>
        </div>

        {/* Optimization Button */}
        <Button 
          onClick={optimizeRoutes} 
          disabled={!apiKey || orders.length === 0 || isOptimizing}
          className="w-full gap-2"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Optimizando con IA...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Optimizar Rutas con IA
            </>
          )}
        </Button>

        {/* Results */}
        {lastOptimization && (
          <Alert className="border-success/20 bg-success/5">
            <Route className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <strong>Rutas Generadas:</strong> {Object.keys(lastOptimization.routes).length}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Object.keys(lastOptimization.routes).map(routeId => (
                    <Badge key={routeId} variant="secondary">
                      Ruta {routeId}: {lastOptimization.routes[routeId].length} pedidos
                    </Badge>
                  ))}
                </div>

                <div className="text-sm text-muted-foreground">
                  <strong>Estrategia:</strong> {lastOptimization.summary}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Info Alert */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>¿Cómo funciona?</strong> El AI analiza las coordenadas, zonas geográficas y 
            capacidades de vehículos para crear rutas optimizadas que minimizan distancias 
            y equilibran cargas de trabajo.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default AIRouteOptimizer;