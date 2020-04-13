import { MENU_TYPE } from '../constants';

export default class MenuConverter {
  static parseGetResult(source) {
    const target = {
      type: MENU_TYPE.LEFT,
      links: [],
      items: []
    };

    if (source) {
      target.type = source.type || MENU_TYPE.LEFT;
      target.links = source.links;
    }

    return target;
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

  static getSettingsConfigForServer(source) {
    const target = {};

    const { menuType, menuLinks } = source;

    target.type = menuType;
    target.links = MenuConverter.getMenuItemsForServer(menuLinks);

    return target;
  }
}
