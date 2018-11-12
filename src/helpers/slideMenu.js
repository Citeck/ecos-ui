export const selectedMenuItemIdKey = 'selectedMenuItemId';

// TODO delete
// const itemId = item.id; // .split(' ').join('_'); TODO
export function processApiData(oldItems) {
  if (!oldItems) {
    return null;
  }

  return oldItems.map(item => {
    let newItem = { ...item };
    delete newItem['widgets'];
    if (item.widgets) {
      newItem.items = processApiData(item.widgets);
    }

    return newItem;
  });
}

export function fetchExpandableItems(items, selectedId) {
  let flatList = [];
  items.map(item => {
    const hasNestedList = !!item.items;
    if (hasNestedList) {
      let isNestedListExpanded = !!item.sectionTitle || hasChildWithId(item.items, selectedId);
      flatList.push(
        {
          id: item.id,
          hasNestedList,
          isNestedListExpanded
        },
        ...fetchExpandableItems(item.items, selectedId)
      );
    }
    return null;
  });

  return flatList;
}

export function hasChildWithId(items, selectedId) {
  let childIndex = items.findIndex(item => item.id === selectedId);
  if (childIndex !== -1) {
    return true;
  }

  let totalItems = items.length;

  for (let i = 0; i < totalItems; i++) {
    if (!items[i].items) {
      continue;
    }

    let hasChild = hasChildWithId(items[i].items, selectedId);
    if (hasChild) {
      return true;
    }
  }

  return false;
}
