import { SortableElement as sortableElement } from '@/services/sortableHoc';

export const SortableElement = sortableElement(({ children }) => {
  return children;
});
