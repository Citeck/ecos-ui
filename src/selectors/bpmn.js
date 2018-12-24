import { createSelector } from 'reselect';

const allCategoriesSelector = state => state.bpmn.categories;
const parentIdSelector = (_, props) => props.parentId;

export const getCategoriesByParentId = createSelector(allCategoriesSelector, parentIdSelector, (allCategories, parentId) => {
  // console.log('parentId', parentId);
  return allCategories.filter(item => {
    if (!parentId) {
      return !item.parentId;
    }

    return item.parentId === parentId;
  });
});
