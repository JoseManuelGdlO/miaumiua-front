import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin } from 'lucide-react';
import { AvailableOrder } from '@/services/routesService';

interface DraggableOrderCardProps {
  order: AvailableOrder;
  isAssigned?: boolean;
}

export const DraggableOrderCard: React.FC<DraggableOrderCardProps> = ({
  order,
  isAssigned = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `order-${order.id}`,
    data: {
      type: 'order',
      order,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border rounded-lg bg-card cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      } ${isAssigned ? 'opacity-60' : ''}`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {order.cliente?.nombre_completo || 'Cliente'}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{order.direccion_entrega || 'Sin dirección'}</span>
          </div>
          <div className="text-xs font-medium text-primary mt-1">
            ${order.total.toLocaleString('es-CO')}
          </div>
          {isAssigned && (
            <Badge variant="secondary" className="text-xs mt-1">
              Asignado
            </Badge>
          )}
        </div>
        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </div>
  );
};
