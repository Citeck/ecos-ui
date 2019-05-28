import { sortableContainer, sortableElement } from 'react-sortable-hoc';

export const SortableContainer = sortableContainer(({ children }) => {
  return children;
});

export const SortableElement = sortableElement(({ children }) => {
  return children;
});
