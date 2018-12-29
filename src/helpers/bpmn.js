export function isCategoryHasChildren(categoryId, categories, models) {
  const hasModels = models.findIndex(item => item.categoryId === categoryId) !== -1;
  const hasNotEmptySubcategories =
    categories.findIndex(item => {
      return item.parentId === categoryId && isCategoryHasChildren(item.id, categories, models);
    }) !== -1;

  return hasModels || hasNotEmptySubcategories;
}
