import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, User } from 'lucide-react';

interface DraggableDriverCardProps {
  driver: {
    id: number;
    codigo_repartidor: string;
    nombre_completo: string;
    tipo_vehiculo: string;
    telefono?: string;
    estado?: string;
  };
  isAssigned?: boolean;
}

export const DraggableDriverCard: React.FC<DraggableDriverCardProps> = ({
  driver,
  isAssigned = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `driver-${driver.id}`,
    data: {
      type: 'driver',
      driver,
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
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-success"></div>
        <div className="flex-1">
          <div className="font-medium text-sm">{driver.nombre_completo}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Truck className="h-3 w-3" />
            <span>{driver.tipo_vehiculo}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {'telefono' in driver ? (driver.telefono || 'Sin teléfono') : 'Disponible'}
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {'estado' in driver ? (driver.estado === 'disponible' ? 'Disponible' : driver.estado) : 'Disponible'}
        </Badge>
        {isAssigned && (
          <Badge variant="secondary" className="text-xs">
            Asignado
          </Badge>
        )}
      </div>
    </div>
  );
};
