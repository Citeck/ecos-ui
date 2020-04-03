import { MenuTypes } from '../constants/menu';

export default class MenuConverter {
  static parseGetResult(source) {
    const target = {
      type: MenuTypes.LEFT,
      links: [],
      items: []
    };

    if (source) {
      target.type = source.type || MenuTypes.LEFT;
      target.links = source.links;
      target.items = source.items;
    }

    return target;
  }

  static getAvailableSoloItemsForWeb(items = []) {
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

    const { type, links } = source;

    target.type = type;
    target.links = MenuConverter.getMenuItemsForServer(links);

    return target;
  }
}
