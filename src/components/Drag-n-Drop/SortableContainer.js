import { sortableContainer } from 'react-sortable-hoc';

export const SortableContainer = sortableContainer(({ children }) => {
  return children;
});
