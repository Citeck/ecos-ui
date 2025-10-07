import { tr } from 'date-fns/locale';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import uniqueId from 'lodash/uniqueId';

import { MenuSettings as ms } from '../constants/menu';

import MenuConverter from './menu';

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
        const collapsed = get(targetItem, 'collapsed', false);

        if (lvl === 0) {
          set(targetItem, 'params.collapsible', collapsible === undefined ? collapsed : collapsible !== false);
        } else {
          set(targetItem, 'params.collapsible', true);
        }

        set(targetItem, 'params.collapsed', collapsed);

        targetItem.label = MenuConverter.getSpecialLabel(item);

        if (ms.ItemTypes.KANBAN === item.type) {
          const journalRef = get(item, '_remoteData_.journalRef') || '';
          const [, journalId] = journalRef.split('@');
          set(targetItem, 'params.journalId', journalId);
        } else if (ms.ItemTypes.JOURNAL === item.type || ms.ItemTypes.DOCLIB === item.type || ms.ItemTypes.PREVIEW_LIST === item.type) {
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
      label: source.label || createVariant.name,
      params: { collapsible: false, collapsed: false, createVariant }
    };
  }
}
