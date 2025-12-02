import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, MapPin, Truck, Route } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mapsService } from '@/services/mapsService';
import { compareOneVsTwoDrivers, type Location } from '@/utils/vrpSolver';

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

// Algoritmo de optimización que siempre comienza desde la bodega (índice 0)
// La matriz de distancias incluye la bodega como primer elemento (índice 0)
function optimizeRouteFromWarehouse(
  numOrders: number,
  distanceMatrix: number[][]
): number[] {
  if (numOrders <= 0) return [0];
  
  // La matriz tiene: [bodega (0), pedido1 (1), pedido2 (2), ...]
  const n = numOrders + 1; // +1 por la bodega
  const warehouseIndex = 0;
  
  const visited = new Set<number>();
  const route: number[] = [warehouseIndex]; // Siempre comenzar desde la bodega
  visited.add(warehouseIndex);
  
  let currentIndex = warehouseIndex;
  
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
      currentIndex = nearestIndex;
    } else {
      break;
    }
  }
  
  return route;
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
  cityInfo?: {
    id: number;
    nombre: string;
    departamento: string;
    direccion_operaciones: string;
  };
  date: string;
  driversAvailable: number;
  onRoutesGenerated: (routes: { [key: string]: Order[] }) => void;
}

const AIRouteOptimizer: React.FC<AIRouteOptimizerProps> = ({
  orders,
  city,
  cityInfo,
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

    if (!cityInfo || !cityInfo.direccion_operaciones) {
      alert('No se encontró la dirección de la bodega para esta ciudad');
      return;
    }

    setIsOptimizing(true);

    try {
      // Paso 0: Geocodificar la dirección de la bodega (punto de inicio)
      console.log('Geocodificando dirección de bodega:', cityInfo.direccion_operaciones);
      const warehouseCoords = await geocodeAddress(
        cityInfo.direccion_operaciones,
        cityInfo.departamento,
        cityInfo.nombre
      );

      if (!warehouseCoords) {
        throw new Error('No se pudo geocodificar la dirección de la bodega');
      }

      console.log('Coordenadas de bodega:', warehouseCoords);

      // Paso 1: Geocodificar direcciones de pedidos para obtener coordenadas
      const ordersWithCoordinates: Order[] = [];
      
      for (const order of orders) {
        let coords = order.coordinates;
        
        // Si no tiene coordenadas o son (0,0), geocodificar
        if (!coords || (coords.lat === 0 && coords.lng === 0)) {
          const geocoded = await geocodeAddress(
            order.address,
            order.estado, // Estado/departamento
            order.ciudad  // Nombre de la ciudad
          );
          if (geocoded) {
            coords = geocoded;
          } else {
            console.warn(`No se pudo geocodificar: ${order.address}, ${order.estado || ''}, ${order.ciudad || ''}`);
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

      // Paso 2: Construir arreglo de ubicaciones para el solver VRP
      const locations: Location[] = [
        {
          lat: warehouseCoords.lat,
          lng: warehouseCoords.lng,
          label: cityInfo.nombre || 'Bodega',
          address: cityInfo.direccion_operaciones
        },
        ...ordersWithCoordinates.map(o => ({
          lat: o.coordinates.lat,
          lng: o.coordinates.lng,
          label: o.orderNumber || `Pedido ${o.id}`,
          address: o.address
        }))
      ];

      // Paso 3: Comparar 1 vs 2 repartidores usando el solver VRP
      const comparison = await compareOneVsTwoDrivers(locations);
      console.log('[AI ROUTES] Resultado comparación 1 vs 2 repartidores:', comparison);

      // Determinar cuántos repartidores usar realmente según disponibilidad
      const recommendedDrivers = comparison.recommendation === '2 drivers' ? 2 : 1;
      const driversToUse = Math.min(driversAvailable, recommendedDrivers);

      if (comparison.recommendation === '2 drivers' && driversAvailable < 2) {
        console.warn('[AI ROUTES] La IA recomienda 2 repartidores, pero solo hay 1 disponible. Se usará 1 repartidor.');
      }

      const optimizedRoutes: { [key: string]: Order[] } = {};

      if (driversToUse === 1) {
        // Usar solución de 1 repartidor
        const route = comparison.oneDriver.routes[0];
        if (route && route.stops.length > 1) {
          const ordersForRoute: Order[] = [];
          for (const stopIndex of route.stops) {
            if (stopIndex === 0) continue; // Saltar la bodega
            const orderIdx = stopIndex - 1; // Ajustar índice (0 es bodega)
            const order = ordersWithCoordinates[orderIdx];
            if (order) {
              ordersForRoute.push(order);
            }
          }
          optimizedRoutes['A'] = ordersForRoute;
        }
      } else {
        // Usar solución de 2 repartidores
        let routeKeyCharCode = 'A'.charCodeAt(0);
        for (const route of comparison.twoDrivers.routes) {
          if (!route || route.stops.length <= 1) continue;

          const ordersForRoute: Order[] = [];
          for (const stopIndex of route.stops) {
            if (stopIndex === 0) continue; // Saltar la bodega
            const orderIdx = stopIndex - 1; // Ajustar índice (0 es bodega)
            const order = ordersWithCoordinates[orderIdx];
            if (order) {
              ordersForRoute.push(order);
            }
          }

          if (ordersForRoute.length > 0) {
            const routeKey = String.fromCharCode(routeKeyCharCode);
            optimizedRoutes[routeKey] = ordersForRoute;
            routeKeyCharCode++;
          }
        }
      }

      const totalOrdersOptimized = Object.values(optimizedRoutes).reduce(
        (sum, arr) => sum + arr.length,
        0
      );

      const summary =
        `Se optimizaron ${totalOrdersOptimized} pedidos usando ${driversToUse} repartidor(es). ` +
        `Recomendación de IA: ${comparison.recommendation}. ` +
        `Motivo: ${comparison.reason}`;

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