import get from 'lodash/get';
import uniqueId from 'lodash/uniqueId';
import cloneDeep from 'lodash/cloneDeep';

import { MenuSettings as ms } from '../constants/menu';

export default class SidebarConverter {
  static getMenuListWeb(source = [], lvl = 0) {
    const target = [];
    if (!source) {
      return target;
    }

    source.forEach(item => {
      let targetItem = cloneDeep(item);
      const collapsible = get(targetItem, 'params.collapsible');
      const collapsed = get(targetItem, 'params.collapsed');

      targetItem.params = {
        ...targetItem.params,
        collapsible: collapsible === undefined ? lvl > 0 : collapsible !== false,
        collapsed: collapsed === undefined ? lvl > 0 : collapsed !== false
      };

      targetItem.label = get(item, '_remoteData_.label') || targetItem.label;
      if (ms.ItemTypes.LINK_CREATE_CASE === item.type) {
        const createVariants = get(item, '_remoteData_.createVariants') || [];

        if (createVariants.length === 1) {
          targetItem = SidebarConverter.getMenuCreateVariantWeb(targetItem, createVariants[0]);
        } else {
          targetItem.items = createVariants.map(variant => SidebarConverter.getMenuCreateVariantWeb(targetItem, variant));
        }
      } else {
        targetItem.items = SidebarConverter.getMenuListWeb(item.items || [], lvl + 1);
      }

      delete targetItem._remoteData_;
      target.push(targetItem);
    });

    return target;
  }

  static getMenuCreateVariantWeb(item, createVariant) {
    return {
      ...item,
      id: uniqueId('createVariant'),
      label: createVariant.name || item.label,
      createVariant,
      params: { collapsible: false, collapsed: false }
    };
  }
}
