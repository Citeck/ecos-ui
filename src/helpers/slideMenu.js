import { getSessionData, setSessionData } from './ls';
import get from 'lodash/get';

export const SELECTED_MENU_ITEM_ID_KEY = 'selectedMenuItemId';

export function fetchExpandableItems(items, selectedId, isSlideMenuOpen) {
  let flatList = [];

  items.forEach(item => {
    if (!!item.items) {
      let isNestedListExpanded =
        isSlideMenuOpen &&
        (hasChildWithId(item.items, selectedId) || get(item, 'params.collapsible', false) ? get(item, 'params.collapsed', false) : true);

      flatList.push(
        {
          id: item.id,
          isNestedListExpanded
        },
        ...fetchExpandableItems(item.items, selectedId, isSlideMenuOpen)
      );
    }
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

export function setSelected(value) {
  setSessionData(SELECTED_MENU_ITEM_ID_KEY, value);
}

export function getSelected() {
  return getSessionData(SELECTED_MENU_ITEM_ID_KEY);
}
