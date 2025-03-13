import { SortableContainer as sortableContainer } from '@/services/sortableHoc';

export const SortableContainer = sortableContainer(({ children }) => {
  return children;
});
