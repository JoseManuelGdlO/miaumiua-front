import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Order {
  id: number;
  orderNumber: string;
  customer: string;
  address: string;
  coordinates: { lat: number; lng: number };
  route?: string;
}

interface RouteMapProps {
  orders: Order[];
  routes: { [key: string]: Order[] };
  onOrderRouteChange: (orderId: number, routeId: string | null) => void;
}

const RouteMap: React.FC<RouteMapProps> = ({ orders, routes, onOrderRouteChange }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const markers = useRef<mapboxgl.Marker[]>([]);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken || isMapInitialized) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-99.1332, 19.4326], // Ciudad de México center
        zoom: 11,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsMapInitialized(true);
        updateMarkers();
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const getRouteColor = (routeId: string) => {
    const colors = {
      'A': '#E91E63', // Primary pink
      'B': '#FF9800', // Orange  
      'C': '#4CAF50', // Green
      'D': '#2196F3', // Blue
      'E': '#9C27B0', // Purple
      'F': '#FF5722', // Deep Orange
    };
    return colors[routeId as keyof typeof colors] || '#757575';
  };

  const updateMarkers = () => {
    if (!map.current || !isMapInitialized) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    orders.forEach(order => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      if (order.route) {
        el.style.backgroundColor = getRouteColor(order.route);
      } else {
        el.style.backgroundColor = '#757575';
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([order.coordinates.lng, order.coordinates.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h3 class="font-semibold">${order.orderNumber}</h3>
            <p class="text-sm text-gray-600">${order.customer}</p>
            <p class="text-xs text-gray-500">${order.address}</p>
            ${order.route ? `<p class="text-xs font-medium text-pink-600">Ruta ${order.route}</p>` : ''}
          </div>
        `))
        .addTo(map.current!);

      markers.current.push(marker);
    });
  };

  useEffect(() => {
    if (mapboxToken) {
      initializeMap();
    }
  }, [mapboxToken]);

  useEffect(() => {
    updateMarkers();
  }, [orders, routes, isMapInitialized]);

  if (!mapboxToken) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Configurar Mapa</h3>
          <p className="text-sm text-muted-foreground">
            Para visualizar las rutas en el mapa, necesitas un token público de Mapbox.
            Puedes obtenerlo en <a href="https://mapbox.com/" target="_blank" className="text-primary hover:underline">mapbox.com</a>
          </p>
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Token Público de Mapbox</Label>
            <Input
              id="mapbox-token"
              type="text"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
          </div>
          <Button onClick={initializeMap} disabled={!mapboxToken}>
            Inicializar Mapa
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative h-96 rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-card p-3 rounded-lg shadow-lg border max-w-xs">
        <h4 className="font-semibold mb-2 text-sm">Leyenda de Rutas</h4>
        <div className="space-y-1">
          {Object.keys(routes).map(routeId => (
            <div key={routeId} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: getRouteColor(routeId) }}
              />
              <span>Ruta {routeId} ({routes[routeId].length} pedidos)</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-gray-500 border border-white" />
            <span>Sin asignar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;