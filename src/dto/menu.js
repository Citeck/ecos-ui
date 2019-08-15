import { MENU_TYPE, QueryKeys } from '../constants';

const getDefaultMenuConfig = {
  menu: {
    type: MENU_TYPE.TOP,
    links: []
  }
};

export default class MenuConverter {
  static parseGetResult(result) {
    if (!result || (result && !Object.keys(result).length)) {
      return {};
    }

    return result[QueryKeys.VALUE_JSON] || getDefaultMenuConfig;
  }

  static getAvailableMenuItemsForWeb(items = []) {
    return items.map(item => {
      return {
        label: item.label,
        link: item.link || '',
        id: item.id
      };
    });
  }

  static getMenuItemsForServer(items = []) {
    return items.map((item, index) => {
      return {
        label: item.label,
        position: index,
        link: item.link || '',
        id: item.id
      };
    });
  }
}
