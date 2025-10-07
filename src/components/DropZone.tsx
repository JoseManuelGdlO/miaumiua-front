import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isOver?: boolean;
  accept?: string[];
}

export const DropZone: React.FC<DropZoneProps> = ({
  id,
  children,
  className,
  isOver = false,
  accept = ['order', 'driver'],
}) => {
  const { isOver: isOverDrop, setNodeRef } = useDroppable({
    id,
    data: {
      accept,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors duration-200',
        (isOver || isOverDrop) && 'bg-primary/10 border-primary/50',
        className
      )}
    >
      {children}
    </div>
  );
};
