import { createSelector } from 'reselect';
import endsWith from 'lodash/endsWith';

import { isCategoryHasChildren } from '../helpers/designer';

export const selectSearchText = state => state.bpmn.searchText;
export const selectAllModels = state => state.bpmn.models;
export const selectAllCategories = state => state.bpmn.categories;
export const selectModelsMap = state => state.bpmn.modelsMap;

const selectCategoryId = (_, props) => props.categoryId;

export const selectModelsBySearchText = createSelector([selectAllModels, selectSearchText], (allModels, searchText) => {
  let models = [...allModels];

  if (searchText !== '') {
    models = models.filter(item => {
      return item.label.toLowerCase().includes(searchText.toLowerCase().trim());
    });
  }

  return models;
});

export const selectCategoriesByParentId = createSelector(
  [selectAllCategories, selectCategoryId, selectSearchText, selectModelsBySearchText],
  (allCategories, parentId, searchText, searchedModels) => {
    let categories = [...allCategories];

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

export const selectModelsInfoByCategoryId = createSelector(
  [selectModelsMap, selectCategoryId, selectSearchText],
  (modelsMap, categoryId, searchText) => {
    const modelsInfo = modelsMap.get(categoryId) || {};
    const modelsInfoCopy = { ...modelsInfo };
    const models = [...(modelsInfoCopy.models || [])];

    modelsInfoCopy.models = [...models.filter(model => model.label.toLowerCase().includes(searchText.toLowerCase().trim()))];

    return { ...modelsInfoCopy } || {};
  }
);

export const selectIsParentHasNotModels = createSelector([selectModelsBySearchText, selectCategoryId], (allModels, categoryId) => {
  return allModels.findIndex(item => item.categoryId === categoryId) === -1;
});

export const selectCaseSensitiveCategories = state => {
  return state.bpmn.categories.map(item => {
    let label = item.label;
    return { value: item.id, label: label };
  });
};
