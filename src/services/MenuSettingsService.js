import uuidV4 from 'uuid/v4';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import { EventEmitter2 } from 'eventemitter2';

import { isExistValue, packInLabel, t } from '../helpers/util';
import { getIconObjectWeb } from '../helpers/icon';
import { treeFindFirstItem, treeGetPathItem, treeRemoveItem } from '../helpers/arrayOfObjects';
import { MenuSettings as ms, MenuTypes } from '../constants/menu';

export default class MenuSettingsService {
  static emitter = new EventEmitter2();

  static Events = {
    SHOW: 'ecos-menu-settings-show',
    HIDE: 'ecos-menu-settings-hide'
  };

  static NonAvailableVersions = [0];

  static getConfigKeyByType(type) {
    switch (type) {
      case MenuTypes.TOP:
        return 'top';
      case MenuTypes.LEFT:
      default:
        return 'left';
    }
  }

  static getItemParams = (data, params) => {
    const permissions = MenuSettingsService.getActionPermissions(data, params);

    return {
      id: data.id || uuidV4(),
      label: data.label,
      type: data.type,
      hidden: !!data.hidden,
      icon: permissions.hasIcon ? getIconObjectWeb(data.icon) : undefined,
      config: { ...data.config },
      items: [],
      allowedFor: get(data, 'allowedFor', []),
      //only for ui, tree
      locked: !!data.hidden,
      draggable: permissions.draggable
    };
  };

  static isChildless = item => {
    return ![ms.ItemTypes.SECTION].includes(get(item, 'type'));
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
        icon: item.hidden ? 'icon-eye-hide' : 'icon-eye-show',
        className: 'ecos-menu-settings-editor-items__action_no-hide',
        text: item.hidden ? 'menu-settings.editor-items.action.show' : 'menu-settings.editor-items.action.hide'
      });

    return actions;
  };

  static isKnownType(type) {
    return Object.values(ms.ItemTypes).includes(type);
  }

  static getActionPermissions(item, params) {
    const knownType = MenuSettingsService.isKnownType(item.type);
    const { level } = params || {};

    return {
      editable: knownType && ![ms.ItemTypes.JOURNAL, ms.ItemTypes.LINK_CREATE_CASE].includes(item.type),
      draggable: knownType && ![].includes(item.type),
      removable: ![].includes(item.type),
      hideable: ![].includes(item.type),
      hasIcon: ![ms.ItemTypes.HEADER_DIVIDER].includes(item.type) && [1].includes(level),
      hasUrl: [ms.ItemTypes.ARBITRARY].includes(item.type),
      hideableLabel: [ms.ItemTypes.SECTION].includes(item.type) && [0].includes(level)
    };
  }

  static getActiveActions(item) {
    const availableActions = MenuSettingsService.getAvailableActions(item);

    return availableActions.filter(act => !isExistValue(get(act, 'when.hidden')) || act.when.hidden === !!item.hidden);
  }

  static convertItemForTree(source) {
    const item = {
      id: source.id,
      dndIdx: source.dndIdx,
      label: source.label,
      icon: source.icon,
      locked: source.locked,
      items: source.items
    };

    if (get(source, 'config.hiddenLabel')) {
      item.label = packInLabel('menu.label.no-name');
    }

    return item;
  }

  static processAction = ({ items: original, action, id, data, level }) => {
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
          newItems = data.map(d => MenuSettingsService.getItemParams(d, { level }));
        } else {
          newItems = [MenuSettingsService.getItemParams(data, { level })];
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
      label: 'menu-item.type.section',
      when: { maxLevel: 0 }
    },
    {
      key: ms.ItemTypes.HEADER_DIVIDER,
      label: 'menu-item.type.header-divider',
      when: { maxLevel: 0, minLevel: 0 }
    },
    {
      key: ms.ItemTypes.JOURNAL,
      label: 'menu-item.type.journal',
      when: { minLevel: 0 }
    },
    {
      key: ms.ItemTypes.ARBITRARY,
      label: 'menu-item.type.arbitrary',
      when: { minLevel: 0 }
    },
    {
      key: ms.ItemTypes.LINK_CREATE_CASE,
      label: 'menu-item.type.link-create-case',
      when: { minLevel: 0 }
    }
  ];

  static getAvailableCreateOptions = (item, params) => {
    const array = cloneDeep(MenuSettingsService.createOptions);
    const { level } = params || {};

    array.forEach(type => {
      type.id = type.id || type.label;
      type.label = t(type.label);
    });

    return array.filter(type => {
      const maxLevel = get(type, 'when.maxLevel');
      const minLevel = get(type, 'when.minLevel');
      const goodLevel =
        !isExistValue(level) || ((!isExistValue(maxLevel) || maxLevel >= level) && (!isExistValue(minLevel) || minLevel <= level));
      const goodType = MenuSettingsService.isKnownType(get(item, 'type'));
      const allowedType = !MenuSettingsService.isChildless(item);

      return goodLevel && (!isExistValue(item) || (goodType && allowedType));
    });
  };
}
