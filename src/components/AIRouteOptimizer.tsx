import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, MapPin, Truck, Route } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mapsService } from '@/services/mapsService';

// Utilidades para cálculo de distancias
interface Coordinates {
  lat: number;
  lng: number;
}

// Calcular distancia haversine entre dos puntos (en km)
function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Geocodificar una dirección usando el backend
async function geocodeAddress(address: string, estado?: string, ciudad?: string): Promise<Coordinates | null> {
  try {
    const response = await mapsService.geocodeAddress(address, estado, ciudad);
    
    if (response.success && response.data) {
      return { lat: response.data.lat, lng: response.data.lng };
    }
    return null;
  } catch (error) {
    console.error('Error geocodificando dirección:', error);
    return null;
  }
}

// Calcular matriz de distancias usando el backend
async function calculateDistanceMatrix(
  origins: Coordinates[],
  destinations: Coordinates[]
): Promise<number[][] | null> {
  try {
    const response = await mapsService.calculateDistanceMatrix(origins, destinations);
    
    if (response.success && response.data) {
      return response.data.matrix.map(row =>
        row.map(element =>
          element.distance !== null ? element.distance : Infinity
        )
      );
    }
    return null;
  } catch (error) {
    console.error('Error calculando matriz de distancias:', error);
    return null;
  }
}

// Algoritmo Nearest Neighbor desde un punto de inicio específico
function nearestNeighborFromStart(
  orders: Order[],
  distanceMatrix: number[][],
  startIndex: number
): { route: number[]; totalDistance: number } {
  if (orders.length <= 1) return { route: [0], totalDistance: 0 };
  
  const n = orders.length;
  const visited = new Set<number>();
  const route: number[] = [startIndex];
  visited.add(startIndex);
  
  let currentIndex = startIndex;
  let totalDistance = 0;
  
  // Nearest Neighbor: siempre ir al punto más cercano no visitado
  while (visited.size < n) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;
    
    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && distanceMatrix[currentIndex][i] < nearestDistance) {
        nearestDistance = distanceMatrix[currentIndex][i];
        nearestIndex = i;
      }
    }
    
    if (nearestIndex !== -1) {
      route.push(nearestIndex);
      visited.add(nearestIndex);
      totalDistance += nearestDistance;
      currentIndex = nearestIndex;
    } else {
      break;
    }
  }
  
  return { route, totalDistance };
}

// Algoritmo de optimización de rutas probando todos los puntos como inicio
// Encuentra la mejor ruta sin importar el punto de inicio o fin
function optimizeRouteOrder(
  orders: Order[],
  distanceMatrix: number[][]
): number[] {
  if (orders.length <= 1) return [0];
  
  const n = orders.length;
  let bestRoute: number[] = [];
  let bestDistance = Infinity;
  
  // Probar cada punto como inicio y elegir la mejor ruta
  for (let startIndex = 0; startIndex < n; startIndex++) {
    const { route, totalDistance } = nearestNeighborFromStart(orders, distanceMatrix, startIndex);
    
    if (totalDistance < bestDistance) {
      bestDistance = totalDistance;
      bestRoute = route;
    }
  }
  
  return bestRoute;
}

// Agrupar pedidos en rutas usando clustering geográfico
function clusterOrders(
  orders: Order[],
  maxOrdersPerRoute: number = 8
): Order[][] {
  if (orders.length === 0) return [];
  
  // Si hay pocos pedidos, crear una sola ruta
  if (orders.length <= maxOrdersPerRoute) {
    return [orders];
  }
  
  // Clustering simple basado en proximidad geográfica
  const clusters: Order[][] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < orders.length; i++) {
    if (used.has(i)) continue;
    
    const cluster: Order[] = [orders[i]];
    used.add(i);
    
    // Buscar pedidos cercanos
    for (let j = i + 1; j < orders.length && cluster.length < maxOrdersPerRoute; j++) {
      if (used.has(j)) continue;
      
      const order1 = orders[i];
      const order2 = orders[j];
      
      if (order1.coordinates && order2.coordinates) {
        const distance = haversineDistance(order1.coordinates, order2.coordinates);
        
        // Si están a menos de 5km, agregar al cluster
        if (distance < 5) {
          cluster.push(orders[j]);
          used.add(j);
        }
      }
    }
    
    clusters.push(cluster);
  }
  
  // Si quedan pedidos sin agrupar, agregarlos al cluster más cercano
  for (let i = 0; i < orders.length; i++) {
    if (used.has(i)) continue;
    
    let nearestClusterIndex = 0;
    let nearestDistance = Infinity;
    
    for (let j = 0; j < clusters.length; j++) {
      if (clusters[j].length >= maxOrdersPerRoute) continue;
      
      const clusterCenter = clusters[j][0];
      if (clusterCenter.coordinates && orders[i].coordinates) {
        const distance = haversineDistance(clusterCenter.coordinates, orders[i].coordinates);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestClusterIndex = j;
        }
      }
    }
    
    if (clusters[nearestClusterIndex].length < maxOrdersPerRoute) {
      clusters[nearestClusterIndex].push(orders[i]);
      used.add(i);
    } else {
      // Crear nuevo cluster si es necesario
      clusters.push([orders[i]]);
      used.add(i);
    }
  }
  
  return clusters;
}

interface Order {
  id: number;
  orderNumber: string;
  customer: string;
  address: string;
  zone: string;
  coordinates: { lat: number; lng: number };
  total: number;
  products: string;
  estado?: string; // Estado/departamento
  ciudad?: string; // Nombre de la ciudad
}

interface AIRouteOptimizerProps {
  orders: Order[];
  city: string;
  date: string;
  driversAvailable: number;
  onRoutesGenerated: (routes: { [key: string]: Order[] }) => void;
}

const AIRouteOptimizer: React.FC<AIRouteOptimizerProps> = ({
  orders,
  city,
  date,
  driversAvailable,
  onRoutesGenerated
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] = useState<{
    routes: { [key: string]: Order[] };
    summary: string;
  } | null>(null);

  const optimizeRoutes = async () => {
    if (orders.length === 0) {
      alert('No hay pedidos para optimizar en esta ciudad/fecha');
      return;
    }

    setIsOptimizing(true);

    try {
      // Paso 1: Geocodificar direcciones para obtener coordenadas
      const ordersWithCoordinates: Order[] = [];
      
      for (const order of orders) {
        let coords = order.coordinates;
        
        // Si no tiene coordenadas o son (0,0), geocodificar
        if (!coords || (coords.lat === 0 && coords.lng === 0)) {
          // Incluir estado y ciudad para mejor precisión en la geocodificación
          const geocoded = await geocodeAddress(
            order.address,
            order.estado, // Estado/departamento
            order.ciudad  // Nombre de la ciudad
          );
          if (geocoded) {
            coords = geocoded;
          } else {
            console.warn(`No se pudo geocodificar: ${order.address}, ${order.estado || ''}, ${order.ciudad || ''}`);
            // Usar coordenadas por defecto de la ciudad si no se puede geocodificar
            continue;
          }
        }
        
        ordersWithCoordinates.push({
          ...order,
          coordinates: coords
        });
      }

      if (ordersWithCoordinates.length === 0) {
        throw new Error('No se pudieron obtener coordenadas para los pedidos');
      }

      // Paso 2: Agrupar pedidos en clusters geográficos
      const clusters = clusterOrders(ordersWithCoordinates, 8);
      
      // Paso 3: Para cada cluster, calcular matriz de distancias y optimizar orden
      const optimizedRoutes: { [key: string]: Order[] } = {};
      let routeId = 'A';
      let totalDistanceSaved = 0;
      let totalRoutes = 0;

      for (const cluster of clusters) {
        if (cluster.length === 0) continue;

        // Si solo hay un pedido, no necesita optimización
        if (cluster.length === 1) {
          optimizedRoutes[routeId] = cluster;
          routeId = String.fromCharCode(routeId.charCodeAt(0) + 1);
          totalRoutes++;
          continue;
        }

        // Calcular matriz de distancias
        const coordinates = cluster.map(o => o.coordinates!);
        const distanceMatrix = await calculateDistanceMatrix(coordinates, coordinates);
        
        if (!distanceMatrix) {
          // Si falla la API, usar distancias haversine como fallback
          const haversineMatrix = coordinates.map((coord1, i) =>
            coordinates.map((coord2, j) => 
              i === j ? 0 : haversineDistance(coord1, coord2)
            )
          );
          
          // Optimizar orden usando Nearest Neighbor (prueba todos los puntos como inicio)
          const optimizedOrder = optimizeRouteOrder(cluster, haversineMatrix);
          optimizedRoutes[routeId] = optimizedOrder.map(index => cluster[index]);
        } else {
          // Optimizar orden usando distancias reales de Google Maps (prueba todos los puntos como inicio)
          const optimizedOrder = optimizeRouteOrder(cluster, distanceMatrix);
          optimizedRoutes[routeId] = optimizedOrder.map(index => cluster[index]);
          
          // Calcular distancia total optimizada
          let routeDistance = 0;
          for (let i = 0; i < optimizedOrder.length - 1; i++) {
            routeDistance += distanceMatrix[optimizedOrder[i]][optimizedOrder[i + 1]];
          }
          totalDistanceSaved += routeDistance;
        }
        
        routeId = String.fromCharCode(routeId.charCodeAt(0) + 1);
        totalRoutes++;
      }

      // Generar resumen de optimización
      const summary = `Se generaron ${totalRoutes} rutas optimizadas para ${ordersWithCoordinates.length} pedidos. ` +
        `Las rutas fueron agrupadas geográficamente y ordenadas para minimizar distancias de viaje. ` +
        `Distancia total estimada: ${totalDistanceSaved.toFixed(2)} km.`;

      setLastOptimization({
        routes: optimizedRoutes,
        summary: summary
      });

      onRoutesGenerated(optimizedRoutes);

    } catch (error) {
      console.error('Error optimizando rutas:', error);
      alert(`Error al optimizar rutas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
          Optimiza rutas automáticamente usando Google Maps para calcular distancias reales y encontrar la ruta más eficiente para {city}. La API Key debe estar configurada en el servidor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          disabled={orders.length === 0 || driversAvailable === 0 || isOptimizing}
          className="w-full gap-2"
          title={driversAvailable === 0 ? "No hay repartidores disponibles" : orders.length === 0 ? "No hay pedidos para optimizar" : ""}
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

        {/* Warning if no drivers */}
        {driversAvailable === 0 && (
          <Alert className="border-warning/20 bg-warning/5">
            <Truck className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Advertencia:</strong> No hay repartidores disponibles. Debe haber al menos un repartidor 
              disponible para crear rutas optimizadas.
            </AlertDescription>
          </Alert>
        )}

        {/* Info Alert */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>¿Cómo funciona?</strong> El sistema geocodifica las direcciones, calcula distancias reales 
            usando Google Maps, agrupa pedidos cercanos geográficamente y optimiza el orden de entrega 
            usando algoritmos de optimización de rutas para minimizar distancias y tiempo de viaje.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default AIRouteOptimizer;