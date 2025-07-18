import { createSelector } from 'reselect';
import endsWith from 'lodash/endsWith';

import { isCategoryHasChildren } from '../helpers/designer';
import { SEARCH_MIN_LENGTH } from '../constants/bpmn';

export const selectSearchText = state => state.bpmn.searchText;// For UI hints
export const selectAllModels = state => state.bpmn.models;
export const selectAllCategories = state => state.bpmn.categories;
export const selectModelsMap = state => state.bpmn.modelsMap;

const selectCategoryId = (_, props) => props.categoryId;

// Optimized search text filtering with trimmed comparison
const normalizeSearchText = createSelector(
  [selectSearchText],
  (searchText) => {
    const trimmed = searchText ? searchText.toLowerCase().trim() : '';
    return trimmed.length >= SEARCH_MIN_LENGTH ? trimmed : '';
  }
);

export const selectModelsBySearchText = createSelector(
  [selectAllModels, normalizeSearchText],
  (allModels, normalizedSearchText) => {
    if (!normalizedSearchText) {
      return allModels;
    }

    return allModels.filter(item =>
      (item.label && item.label.toLowerCase().includes(normalizedSearchText)) ||
      (item.id && item.id.toLowerCase().includes(normalizedSearchText))
    );
  }
);

export const selectCategoriesByParentId = createSelector(
  [selectAllCategories, selectCategoryId, normalizeSearchText, selectModelsBySearchText],
  (allCategories, parentId, normalizedSearchText, searchedModels) => {
    if (!allCategories || !Array.isArray(allCategories)) {
      return [];
    }

    return allCategories.filter(item => {
      if (!parentId) {
        return !item.parentId;
      }

      if (!endsWith(item.parentId, parentId)) {
        return false;
      }

      if (normalizedSearchText) {
        return isCategoryHasChildren(item.id, allCategories, searchedModels);
      }

      return true;
    });
  }
);

export const selectModelsInfoByCategoryId = createSelector(
  [selectModelsMap, selectCategoryId, normalizeSearchText],
  (modelsMap, categoryId, normalizedSearchText) => {
    const modelsInfo = modelsMap.get(categoryId);
    if (!modelsInfo || !modelsInfo.models) {
      return {};
    }

    if (!normalizedSearchText) {
      return { ...modelsInfo };
    }

    // Only filter if search text exists
    const filteredModels = modelsInfo.models.filter(model =>
      (model.label && model.label.toLowerCase().includes(normalizedSearchText)) ||
      (model.id && model.id.toLowerCase().includes(normalizedSearchText))
    );

    return {
      ...modelsInfo,
      models: filteredModels
    };
  }
);

export const selectIsParentHasNotModels = createSelector(
  [selectModelsBySearchText, selectCategoryId],
  (allModels, categoryId) => {
    if (!allModels || !Array.isArray(allModels)) {
      return true;
    }
    return !allModels.some(item => item.categoryId === categoryId);
  }
);

export const selectCanCreateDef = createSelector(
  [selectAllCategories],
  (allCategories) => {
    if (!allCategories || !Array.isArray(allCategories)) {
      return false;
    }
    return allCategories.some(category => category.canCreateDef);
  }
);
