import cloneDeep from 'lodash/cloneDeep';
import uuidV4 from 'uuid/v4';
import get from 'lodash/get';
import set from 'lodash/set';

import { deepClone, isExistValue, t } from '../helpers/util';
import { getIconObjectWeb } from '../helpers/icon';
import { treeFindFirstItem, treeGetPathItem, treeRemoveItem } from '../helpers/arrayOfObjects';
import { MenuSettings as ms, MenuTypes } from '../constants/menu';

export default class MenuSettingsService {
  static getConfigKeyByType(type) {
    switch (type) {
      case MenuTypes.TOP:
        return 'top';
      case MenuTypes.LEFT:
      default:
        return 'left';
    }
  }

  static getItemParams = data => {
    const permissions = MenuSettingsService.getActionPermissions(data);

    return {
      id: data.id || uuidV4(),
      label: data.label,
      type: data.type,
      hidden: !!data.hidden,
      icon: permissions.hasIcon ? getIconObjectWeb(data.icon) : undefined,
      config: { ...data.config },
      items: [],
      //only for ui, tree
      locked: !!data.hidden,
      draggable: permissions.draggable
    };
  };

  static isChildless = item => {
    return ![ms.ItemTypes.SECTION].includes(item.type);
  };

  static getAvailableActions = item => {
    const actions = [];
    const permissions = MenuSettingsService.getActionPermissions(item);

    permissions.editable &&
      actions.push({
        type: ms.ActionTypes.EDIT,
        icon: 'icon-edit',
        text: 'menu-settings.editor-items.action.edit',
        when: { hidden: false }
      });

    permissions.removable &&
      actions.push({
        type: ms.ActionTypes.DELETE,
        icon: 'icon-delete',
        text: 'menu-settings.editor-items.action.delete',
        className: 'ecos-menu-settings-editor-items__action_caution',
        when: { hidden: false }
      });

    permissions.hideable &&
      actions.push({
        type: ms.ActionTypes.ACTIVE,
        icon: item.hidden ? 'icon-off' : 'icon-on',
        className: 'ecos-menu-settings-editor-items__action_no-hide',
        text: item.hidden ? 'menu-settings.editor-items.action.show' : 'menu-settings.editor-items.action.hide'
      });

    return actions;
  };

  static getActionPermissions(item) {
    const knownType = Object.keys(ms.ItemTypes).includes(item.type);

    return {
      editable: knownType && ![ms.ItemTypes.JOURNAL, ms.ItemTypes.LINK_CREATE_CASE].includes(item.type),
      removable: ![].includes(item.type),
      draggable: ![].includes(item.type),
      hideable: ![].includes(item.type),
      hasIcon: ![ms.ItemTypes.HEADER_DIVIDER].includes(item.type)
    };
  }

  static getActiveActions(item) {
    const availableActions = MenuSettingsService.getAvailableActions(item);

    return availableActions.filter(act => !isExistValue(get(act, 'when.hidden')) || act.when.hidden === item.hidden);
  }

  static processAction = ({ items: original, action, id, data }) => {
    const items = cloneDeep(original) || [];
    const foundItem = treeFindFirstItem({ items, key: 'id', value: id });

    switch (action) {
      case ms.ActionTypes.ACTIVE:
        foundItem.hidden = !foundItem.hidden;
        foundItem.locked = foundItem.hidden;
        break;
      case ms.ActionTypes.DISPLAY_COUNT:
        set(foundItem, 'config.displayCount', !get(foundItem, 'config.displayCount'));
        break;
      case ms.ActionTypes.CREATE: {
        const path = treeGetPathItem({ items, value: id, key: 'id' });
        let newItems;

        if (Array.isArray(data)) {
          newItems = data.map(d => MenuSettingsService.getItemParams(d));
        } else {
          newItems = [MenuSettingsService.getItemParams(data)];
        }

        if (path) {
          get(items, path, {}).items.push(...newItems);
        } else {
          items.push(...newItems);
        }

        return { items, newItems };
      }
      case ms.ActionTypes.EDIT: {
        const path = treeGetPathItem({ items, value: id, key: 'id' });
        const newItems = [{ ...get(items, path), ...data }];

        set(items, path, newItems[0]);

        return { items, newItems };
      }
      case ms.ActionTypes.DELETE:
        treeRemoveItem({ items, key: 'id', value: id });
        break;
      default:
        break;
    }

    return { items };
  };

  static createOptions = [
    {
      key: ms.ItemTypes.SECTION,
      forbiddenTypes: [],
      label: 'menu-item.type.section'
    },
    {
      key: ms.ItemTypes.JOURNAL,
      forbiddenTypes: [],
      forbiddenAllTypes: true,
      label: 'menu-item.type.journal'
    },
    {
      key: ms.ItemTypes.ARBITRARY,
      forbiddenAllTypes: true,
      label: 'menu-item.type.arbitrary'
    },
    {
      key: ms.ItemTypes.LINK_CREATE_CASE,
      forbiddenAllTypes: true,
      label: 'menu-item.type.link-create-case'
    },
    {
      key: ms.ItemTypes.HEADER_DIVIDER,
      forbiddenAllTypes: true,
      label: 'menu-item.type.header-divider'
    }
  ];

  static getAvailableCreateOptions = item => {
    const array = deepClone(MenuSettingsService.createOptions || []);

    array.forEach(item => {
      item.id = item.id || item.label;
      item.label = t(item.label);
    });

    return array.filter(opt => !item || !!opt.forbiddenAllTypes || !opt.forbiddenTypes.includes(item.type));
  };
}
