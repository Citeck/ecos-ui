import { MENU_TYPE, QueryKeys } from '../constants';

export const getDefaultMenuConfig = {
  menu: {
    type: MENU_TYPE.LEFT,
    links: []
  }
};

export function parseGetResult(result) {
  if (!result || (result && !Object.keys(result).length)) {
    return {};
  }

  return result[QueryKeys.VALUE_JSON] || getDefaultMenuConfig;
}

export function getAvailableMenuItemsForWeb(items = []) {
  return items.map(item => {
    return {
      label: item.label,
      link: item.link || '',
      id: item.id
    };
  });
}

export function getMenuItemsForServer(items = []) {
  return items.map((item, index) => {
    return {
      label: item.label,
      position: index,
      link: item.link || '',
      id: item.id
    };
  });
}
