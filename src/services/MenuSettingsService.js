import uuidV4 from 'uuid/v4';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import { EventEmitter2 } from 'eventemitter2';

import { isExistValue, packInLabel, t } from '../helpers/util';
import { getIconObjectWeb } from '../helpers/icon';
import { treeFindFirstItem, treeGetPathItem, treeRemoveItem } from '../helpers/arrayOfObjects';
import { ConfigTypes, CreateOptions, MenuSettings as ms, MenuTypes, UserMenu, UserOptions } from '../constants/menu';

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
    const permissions = MenuSettingsService.getPowers(data, params);

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
    const permissions = MenuSettingsService.getPowers(item);

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

  static getPowers(item, params) {
    const knownType = MenuSettingsService.isKnownType(item.type);
    const { level, configType } = params || {};

    return {
      editable:
        knownType &&
        ![ms.ItemTypes.JOURNAL, ms.ItemTypes.KANBAN, ms.ItemTypes.DOCLIB, ms.ItemTypes.PREVIEW_LIST, ms.ItemTypes.DASHBOARD].includes(
          item.type
        ),
      draggable: knownType && ![].includes(item.type),
      removable: ![].includes(item.type),
      hideable: ![].includes(item.type),
      hasIcon:
        (configType === ConfigTypes.USER && ![ms.ItemTypes.USER_STATUS].includes(item.type)) ||
        ([ConfigTypes.LEFT].includes(configType) && ![ms.ItemTypes.HEADER_DIVIDER].includes(item.type) && [1].includes(level)),
      hasUrl: [ms.ItemTypes.ARBITRARY].includes(item.type),
      hideableLabel: [ConfigTypes.LEFT].includes(configType) && [ms.ItemTypes.SECTION].includes(item.type) && [0].includes(level)
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

  static processAction = ({ items: original, action, id, data, level, configType }) => {
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
          newItems = data.map(d => MenuSettingsService.getItemParams(d, { level, configType }));
        } else {
          newItems = [MenuSettingsService.getItemParams(data, { level, configType })];
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

  static leftMenuCreateOptions = [
    { ...CreateOptions.SECTION, when: { maxLevel: 0 } },
    { ...CreateOptions.HEADER_DIVIDER, when: { maxLevel: 0, minLevel: 0 } },
    { ...CreateOptions.JOURNAL, when: { minLevel: 0 } },
    { ...CreateOptions.KANBAN, when: { minLevel: 0 } },
    { ...CreateOptions.DASHBOARD, when: { minLevel: 0 } },
    { ...CreateOptions.WIKI, when: { minLevel: 0 } },
    { ...CreateOptions.DOCLIB, when: { minLevel: 0 } },
    { ...CreateOptions.PREVIEW_LIST, when: { minLevel: 0 } },
    { ...CreateOptions.ARBITRARY, when: { minLevel: 0 } },
    { ...CreateOptions.LINK_CREATE_CASE, when: { minLevel: 0 } },
    { ...CreateOptions.START_WORKFLOW, when: { minLevel: 0 } }
  ];

  static createMenuCreateOptions = [
    { ...CreateOptions.SECTION, when: { maxLevel: 0 } },
    CreateOptions.CREATE_IN_SECTION,
    CreateOptions.ARBITRARY,
    CreateOptions.LINK_CREATE_CASE,
    CreateOptions.START_WORKFLOW
    // CreateOptions.EDIT_RECORD,// todo for next revision, see task comment https://citeck.atlassian.net/browse/ECOSUI-959?focusedCommentId=97045
  ];

  static userMenuCreateOptions = [
    {
      ...UserOptions.USER_PROFILE,
      default: UserMenu.USER_PROFILE
    },
    {
      ...UserOptions.USER_STATUS,
      default: UserMenu.USER_STATUS
    },
    {
      ...UserOptions.USER_CHANGE_PASSWORD,
      default: UserMenu.USER_CHANGE_PASSWORD
    },
    {
      ...UserOptions.USER_FEEDBACK,
      default: UserMenu.USER_FEEDBACK
    },
    {
      ...UserOptions.USER_SEND_PROBLEM_REPORT,
      default: UserMenu.USER_SEND_PROBLEM_REPORT
    },
    {
      ...UserOptions.USER_LOGOUT,
      default: UserMenu.USER_LOGOUT
    },
    UserOptions.ARBITRARY
  ];

  static getCreateOptionsByType(configType) {
    switch (configType) {
      case ConfigTypes.LEFT:
        return MenuSettingsService.leftMenuCreateOptions;
      case ConfigTypes.CREATE:
        return MenuSettingsService.createMenuCreateOptions;
      case ConfigTypes.USER:
        return MenuSettingsService.userMenuCreateOptions;
      default:
        return [];
    }
  }

  static getAvailableCreateOptions = (item, params) => {
    const { configType, level } = params || {};
    const array = cloneDeep(MenuSettingsService.getCreateOptionsByType(configType));

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
