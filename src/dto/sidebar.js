import get from 'lodash/get';

import { deepClone } from '../helpers/util';

export default class SidebarConverter {
  static getMenuListWeb(source = []) {
    const target = [];
    if (!source) {
      return target;
    }

    source.forEach(item => {
      const targetItem = deepClone(item);

      targetItem.params = {
        ...targetItem.params,
        collapsible: get(targetItem, 'params.collapsible') !== false,
        collapsed: get(targetItem, 'params.collapsed') !== false
      };

      targetItem.items = SidebarConverter.getMenuListWeb(item.items || []);

      target.push(targetItem);
    });

    return target;
  }
}
