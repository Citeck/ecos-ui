import { createSelector } from 'reselect';
import { isCategoryHasChildren } from '../helpers/bpmn';
// import { SORT_FILTER_LAST_MODIFIED, SORT_FILTER_OLD, SORT_FILTER_AZ, SORT_FILTER_ZA } from '../constants/bpmn';

export const selectSortFilter = state => state.bpmn.sortFilter;
export const selectSearchText = state => state.bpmn.searchText;
export const selectAllModels = state => state.bpmn.models;
export const selectAllCategories = state => state.bpmn.categories;

const selectCategoryId = (_, props) => props.categoryId;

export const selectModelsBySearchText = createSelector([selectAllModels, selectSearchText], (allModels, searchText) => {
  let models = allModels;

  if (searchText !== '') {
    models = models.filter(item => {
      return item.label.toLowerCase().includes(searchText.toLowerCase().trim());
    });
  }

  return models;
});

export const selectCategoriesByParentId = createSelector(
  [selectAllCategories, selectCategoryId, selectSortFilter, selectSearchText, selectModelsBySearchText],
  (allCategories, parentId, sortFilter, searchText, searchedModels) => {
    return allCategories.filter(item => {
      if (!parentId) {
        return !item.parentId;
      }

      if (item.parentId !== parentId) {
        return false;
      }

      if (searchText) {
        return isCategoryHasChildren(item.id, allCategories, searchedModels);
      }

      return true;
    });
  }
);

export const selectModelsByCategoryId = createSelector(
  [selectModelsBySearchText, selectCategoryId, selectSortFilter],
  (allModels, categoryId, sortFilter) => {
    let models = allModels;

    // TODO sortFilter

    return models.filter(item => {
      return item.categoryId === categoryId;
    });
  }
);

export const selectIsParentHasNotModels = createSelector([selectModelsBySearchText, selectCategoryId], (allModels, categoryId) => {
  return allModels.findIndex(item => item.categoryId === categoryId) === -1;
});
