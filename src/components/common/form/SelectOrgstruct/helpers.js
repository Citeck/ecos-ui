export function handleResponse(result) {
  return result.map(item => ({
    id: item.nodeRef,
    label: item.displayName,
    hasChildren: !!item.groupType,
    isLoaded: false,
    isOpen: false,
    attributes: item
  }));
}

export function prepareSelected(selectedItem) {
  return {
    ...selectedItem,
    hasChildren: false,
    isSelected: true,
    parentId: undefined
  };
}
