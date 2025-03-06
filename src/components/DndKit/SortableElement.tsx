import { useSortable } from '@dnd-kit/sortable';
import React from 'react';

interface SortableElementProps {
  id: string | number;
  children: React.ReactNode;
}

export const SortableElement: React.FC<SortableElementProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style: React.CSSProperties = {
    transition,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};
