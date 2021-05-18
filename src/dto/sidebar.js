import get from 'lodash/get';
import set from 'lodash/set';
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
      if (!item.hidden) {
        let targetItem = cloneDeep(item);
        const collapsible = get(targetItem, 'params.collapsible');
        const collapsed = get(targetItem, 'params.collapsed');

        set(targetItem, 'params.collapsible', collapsible === undefined ? lvl > 0 : collapsible !== false);
        set(targetItem, 'params.collapsed', collapsed === undefined ? lvl > 0 : collapsed !== false);

        targetItem.label = get(item, '_remoteData_.label') || targetItem.label;

        if (ms.ItemTypes.JOURNAL === item.type) {
          set(targetItem, 'params.journalId', get(item, '_remoteData_.journalId'));
        } else if (ms.ItemTypes.LINK_CREATE_CASE === item.type) {
          targetItem = SidebarConverter.getMenuCreateVariantWeb(targetItem, get(item, 'config.variant'));
        } else {
          targetItem.items = SidebarConverter.getMenuListWeb(item.items || [], lvl + 1);
        }

        delete targetItem._remoteData_;
        target.push(targetItem);
      }
    });

    return target;
  }

  static getMenuCreateVariantWeb(source, createVariant = {}) {
    return {
      ...source,
      id: uniqueId('createVariant'),
      label: createVariant.name || source.label,
      params: { collapsible: false, collapsed: false, createVariant }
    };
  }
}
