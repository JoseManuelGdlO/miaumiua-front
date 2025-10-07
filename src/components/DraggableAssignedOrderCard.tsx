import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin } from 'lucide-react';
import { RouteOrder } from '@/services/routesService';

interface DraggableAssignedOrderCardProps {
  routeOrder: RouteOrder;
}

export const DraggableAssignedOrderCard: React.FC<DraggableAssignedOrderCardProps> = ({
  routeOrder,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `assigned-order-${routeOrder.id}`,
    data: {
      type: 'assigned-order',
      order: routeOrder.pedido,
      routeOrder,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 bg-background rounded border text-xs cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <Package className="h-3 w-3" />
      <span className="flex-1">
        {routeOrder.pedido?.cliente?.nombre_completo || 'Cliente'}
      </span>
      <Badge variant="outline" className="text-xs">
        ${routeOrder.pedido?.total || 0}
      </Badge>
      <Badge variant="secondary" className="text-xs">
        #{routeOrder.orden_entrega}
      </Badge>
    </div>
  );
};
