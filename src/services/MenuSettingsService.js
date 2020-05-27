import cloneDeep from 'lodash/cloneDeep';
import uniqueId from 'lodash/uniqueId';
import isString from 'lodash/isString';

import { deepClone, isExistValue, t } from '../helpers/util';
import { treeFindFirstItem, treeRemoveItem } from '../helpers/arrayOfObjects';
import { MenuSettings as ms } from '../constants/menu';
import { SourcesId } from '../constants';

export default class MenuSettingsService {
  static getItemParams = data => {
    const dndIdx = parseInt(`${Date.now()}000${uniqueId()}`);
    const permissions = MenuSettingsService.getActionPermissions(data);

    let icon = { value: 'icon-empty-icon' };

    if (isString(data.icon)) {
      const [source, value] = data.icon.split('@');

      if (value && source) {
        icon.value = value;
        icon.type = source === SourcesId.ICON ? 'img' : 'icon';
      }
    } else {
      icon = { ...icon, ...data.icon };
    }

    return {
      id: data.id || `${data.type}-${dndIdx}`,
      label: data.label,
      type: data.type,
      hidden: !!data.hidden,
      displayCount: false, //todo
      items: [],
      actionConfig: [],
      icon,
      //for ui, tree
      dndIdx: data.dndIdx || dndIdx,
      locked: !!data.hidden,
      draggable: permissions.draggable
    };
  };

  static getAvailableActions = item => {
    const actions = [];
    const permissions = MenuSettingsService.getActionPermissions(item);

    if (permissions.editable) {
      actions.push({
        type: ms.ActionTypes.EDIT,
        icon: 'icon-edit',
        text: 'menu-settings.editor-items.action.edit',
        when: { hidden: false }
      });
    }

    if (permissions.removable) {
      actions.push({
        type: ms.ActionTypes.DELETE,
        icon: 'icon-delete',
        text: 'menu-settings.editor-items.action.delete',
        className: 'ecos-menu-settings-editor-items__action_caution',
        when: { hidden: false }
      });
    }

    if (permissions.hideable) {
      actions.push(
        {
          type: ms.ActionTypes.ACTIVE,
          icon: 'icon-on',
          className: 'ecos-menu-settings-editor-items__action_no-hide',
          when: { hidden: false },
          text: 'menu-settings.editor-items.action.hide'
        },
        {
          type: ms.ActionTypes.NO_ACTIVE,
          icon: 'icon-off',
          className: 'ecos-menu-settings-editor-items__action_no-hide',
          when: { hidden: true },
          text: 'menu-settings.editor-items.action.show'
        }
      );
    }

    return actions;
  };

  static getActiveActions(item) {
    const availableActions = MenuSettingsService.getAvailableActions(item);

    return availableActions.filter(act => !isExistValue(act.when.hidden) || act.when.hidden === item.hidden);
  }

  static processAction = ({ items: original, action, id }) => {
    const items = cloneDeep(original);
    const foundItem = treeFindFirstItem({ items, key: 'id', value: id });

    switch (action) {
      case ms.ActionTypes.ACTIVE:
      case ms.ActionTypes.NO_ACTIVE:
        foundItem.hidden = !foundItem.hidden;
        foundItem.locked = foundItem.hidden;
        break;
      case ms.ActionTypes.EDIT:
        break;
      case ms.ActionTypes.DELETE:
        treeRemoveItem({ items, key: 'id', value: id });
        break;
      default:
        break;
    }

    return items;
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

  static isChildless = item => {
    return ![ms.ItemTypes.SECTION].includes(item.type);
  };

  static getActionPermissions(item) {
    const knownType = Object.keys(ms.ItemTypes).includes(item.type);

    return {
      editable: knownType && ![ms.ItemTypes.JOURNAL, ms.ItemTypes.LINK_CREATE_CASE].includes(item.type),
      removable: ![].includes(item.type),
      draggable: ![].includes(item.type),
      hideable: ![].includes(item.type)
    };
  }
}
