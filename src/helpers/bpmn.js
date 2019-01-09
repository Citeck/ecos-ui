export function isCategoryHasChildren(categoryId, categories, models) {
  const hasModels = models.findIndex(item => item.categoryId === categoryId) !== -1;
  const hasNotEmptySubcategories =
    categories.findIndex(item => {
      return item.parentId === categoryId && isCategoryHasChildren(item.id, categories, models);
    }) !== -1;

  return hasModels || hasNotEmptySubcategories;
}

export function compareOld(a, b) {
  if (a.modified > b.modified) {
    return 1;
  }

  if (a.modified < b.modified) {
    return -1;
  }

  return 0;
}

export function compareLastModified(a, b) {
  if (a.modified < b.modified) {
    return 1;
  }

  if (a.modified > b.modified) {
    return -1;
  }

  return 0;
}

export function compareAZ(a, b) {
  if (a.label > b.label) {
    return 1;
  }

  if (a.label < b.label) {
    return -1;
  }

  return 0;
}

export function compareZA(a, b) {
  if (a.label < b.label) {
    return 1;
  }

  if (a.label > b.label) {
    return -1;
  }

  return 0;
}
