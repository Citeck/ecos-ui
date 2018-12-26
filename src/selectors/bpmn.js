import { createSelector } from 'reselect';

export const selectAllCategories = state => state.bpmn.categories;
const selectParentId = (_, props) => props.parentId;

export const selectCategoriesByParentId = createSelector(selectAllCategories, selectParentId, (allCategories, parentId) => {
  // console.log('parentId', parentId);
  return allCategories.filter(item => {
    if (!parentId) {
      return !item.parentId;
    }

    return item.parentId === parentId;
  });
});
