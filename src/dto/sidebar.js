import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

export default class SidebarConverter {
  static getMenuListWeb(source = [], lvl = 0) {
    const target = [];
    if (!source) {
      return target;
    }

    source.forEach(item => {
      const targetItem = cloneDeep(item);
      const collapsible = get(targetItem, 'params.collapsible');
      const collapsed = get(targetItem, 'params.collapsed');

      targetItem.params = {
        ...targetItem.params,
        collapsible: collapsible === undefined ? lvl > 0 : collapsible !== false,
        collapsed: collapsed === undefined ? lvl > 0 : collapsed !== false
      };

      targetItem.items = SidebarConverter.getMenuListWeb(item.items || [], lvl + 1);

      target.push(targetItem);
    });

    return target;
  }
}
