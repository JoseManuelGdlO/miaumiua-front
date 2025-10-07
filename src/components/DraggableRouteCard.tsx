import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, MapPin, User, Package } from 'lucide-react';
import { DraggableAssignedOrderCard } from './DraggableAssignedOrderCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Route } from '@/services/routesService';

interface DraggableRouteCardProps {
  route: Route;
  onAssignDriver: (routeId: string, driverId: number) => void;
  onUnassignDriver: (routeId: string) => void;
  onDeleteRoute: (routeId: string) => void;
  onAddOrder: (orderId: number, routeId: string) => void;
  drivers: any[];
  canEdit: boolean;
  canDelete: boolean;
}

export const DraggableRouteCard: React.FC<DraggableRouteCardProps> = ({
  route,
  onAssignDriver,
  onUnassignDriver,
  onDeleteRoute,
  onAddOrder,
  drivers,
  canEdit,
  canDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `route-${route.id}`,
    data: {
      type: 'route',
      route,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const totalOrders = route.total_pedidos || 0;
  const totalValue = route.pedidos?.reduce((sum, p) => sum + (p.pedido?.total || 0), 0) || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-3 bg-card ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div 
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          <Badge className="bg-primary text-primary-foreground">
            {route.nombre_ruta}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {totalOrders} pedidos
          </span>
          <Badge variant="outline" className="text-xs">
            {route.estado}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <>
                {route.repartidor && (
                  <DropdownMenuItem
                    onClick={() => onUnassignDriver(route.id.toString())}
                    className="text-orange-600"
                  >
                    Desasignar Repartidor
                  </DropdownMenuItem>
                )}
                {drivers.map((driver) => (
                  <DropdownMenuItem
                    key={driver.id}
                    onClick={() => onAssignDriver(route.id.toString(), driver.id)}
                  >
                    Asignar a {driver.nombre_completo}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={() => onDeleteRoute(route.id.toString())}
                className="text-destructive"
              >
                Eliminar Ruta
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>
            {route.repartidor?.nombre_completo || 'Sin repartidor'}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground mb-2">
          Total: ${totalValue.toLocaleString('es-CO')}
          {route.repartidor && (
            <div>Repartidor: {route.repartidor.nombre_completo}</div>
          )}
        </div>

        {/* Drop zone para pedidos */}
        <div className="min-h-[60px] border-2 border-dashed border-muted-foreground/25 rounded-lg p-2 bg-muted/20">
          <div className="text-xs text-muted-foreground text-center mb-2">
            Arrastra pedidos aquí
          </div>
          {route.pedidos && route.pedidos.length > 0 ? (
              <div className="space-y-1">
                {route.pedidos.map((pedido) => (
                  <DraggableAssignedOrderCard
                    key={pedido.id}
                    routeOrder={pedido}
                  />
                ))}
              </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center">
              Sin pedidos asignados
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
