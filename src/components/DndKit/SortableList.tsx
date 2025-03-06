import { DndContext, closestCenter, useSensors, MouseSensor, useSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import React from 'react';

interface SortableListProps {
  tabs: string[];
  handleSortEnd: (event: any) => void;
  handleBeforeSortStart: (event: any) => void;
  renderTabItem: (tab: string, index: number) => React.ReactNode;
}

export const SortableList: React.FC<SortableListProps> = ({ tabs, handleSortEnd, handleBeforeSortStart, renderTabItem }) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleSortEnd}
      modifiers={[restrictToHorizontalAxis]}
      onDragStart={handleBeforeSortStart}
    >
      <SortableContext items={tabs} strategy={horizontalListSortingStrategy}>
        {tabs.map((tab, index) => renderTabItem(tab, index))}
      </SortableContext>
    </DndContext>
  );
};
