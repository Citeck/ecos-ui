import { endsWith } from 'lodash';
import { createSelector } from 'reselect';

import { isCategoryHasChildren } from '../helpers/designer';

export const selectSearchText = state => state.dmn.searchText;
export const selectAllModels = state => state.dmn.models;
export const selectAllCategories = state => state.dmn.categories;

const selectCategoryId = (_, props) => props.categoryId;

export const selectModelsBySearchText = createSelector(
  [selectAllModels, selectSearchText],
  (allModels, searchText) => {
    const models = [...allModels];

    if (searchText !== '') {
      return models.filter(item => item.label.toLowerCase().includes(searchText.toLowerCase().trim()));
    }

    return models;
  }
);

export const selectAllCategoriesByParentId = createSelector(
  [selectAllCategories, selectCategoryId, selectSearchText, selectModelsBySearchText],
  (allCategories, parentId, searchText, searchedModels) => {
    const categories = [...allCategories];

    return categories.filter(item => {
      if (!parentId) {
        return !item.parentId;
      }

      if (!endsWith(item.parentId, parentId)) {
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
  [selectModelsBySearchText, selectCategoryId],
  (allModels, categoryId) => {
    return allModels.filter(item => item.categoryId === categoryId);
  }
);

export const selectIsParentHasNotModels = createSelector(
  [selectModelsBySearchText, selectCategoryId],
  (allModels, categoryId) => {
    return allModels.findIndex(item => item.categoryId === categoryId) === -1;
  }
);
