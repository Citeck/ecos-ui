import { isNewJournalsPageEnable } from '../../../api/export/journalsApi';
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

export function getNewJournalsPageEnable() {
  return isNewJournalsPageEnable();
}
