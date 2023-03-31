import endsWith from 'lodash/endsWith';

export function isCategoryHasChildren(categoryId, categories, models) {
  const hasModels = models.findIndex(item => item.categoryId === categoryId) !== -1;
  const hasNotEmptySubcategories =
    categories.findIndex(item => {
      return endsWith(item.parentId, categoryId) && isCategoryHasChildren(item.id, categories, models);
    }) !== -1;

  return hasModels || hasNotEmptySubcategories;
}

export function getDesignerPagePositionState(key) {
  return JSON.parse(localStorage.getItem(key));
}

export function saveDesignerPagePositionState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeDesignerPagePositionState(key) {
  localStorage.removeItem(key);
}
