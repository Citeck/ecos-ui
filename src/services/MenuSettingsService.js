import cloneDeep from 'lodash/cloneDeep';

import { deepClone, isExistValue, t } from '../helpers/util';
import { treeFindFirstItem } from '../helpers/arrayOfObjects';
import { MenuSettings as ms } from '../constants/menu';

export default class MenuSettingsService {
  static defaultItemProps = {
    icon: { value: 'icon-empty-icon', type: 'icon', source: 'menu' },
    hidden: false,
    displayCount: false,
    editable: false,
    removable: true,
    draggable: true,
    items: [],
    actionConfig: []
  };

  static getAvailableActions = item => {
    const actions = [];

    if (item.editable) {
      actions.push({
        type: ms.ActionTypes.EDIT,
        icon: 'icon-edit',
        text: 'menu-settings.editor-items.action.edit',
        when: { hidden: false }
      });
    }

    if (item.removable) {
      actions.push({
        type: ms.ActionTypes.DELETE,
        icon: 'icon-delete',
        text: 'menu-settings.editor-items.action.delete',
        className: 'ecos-menu-settings-editor-items__action_caution',
        when: { hidden: false }
      });
    }

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

    return actions;
  };

  static processAction = ({ items: original, action, id }) => {
    const items = cloneDeep(original);
    const foundItem = treeFindFirstItem({ items, key: 'id', value: id });

    switch (action) {
      case ms.ActionTypes.ACTIVE:
      case ms.ActionTypes.NO_ACTIVE:
        foundItem.hidden = !foundItem.hidden;
        foundItem.locked = !foundItem.hidden;
        break;
      case ms.ActionTypes.EDIT:
      case ms.ActionTypes.DELETE:
      default:
        break;
    }

    return items;
  };

  static getActiveActions(item) {
    const availableActions = MenuSettingsService.getAvailableActions(item);

    return availableActions.filter(act => !isExistValue(act.when.hidden) || act.when.hidden === item.hidden);
  }

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

  static isEditable = item => {
    return ![ms.ItemTypes.JOURNAL, ms.ItemTypes.LINK_CREATE_CASE].includes(item.type);
  };

  static testIcons = [
    { code: 'active-tasks' },
    { code: 'completed-tasks' },
    { code: 'controlled' },
    { code: 'subordinate-tasks' },
    { code: 'task-statistic' },
    { code: 'initiator-tasks' },
    { code: 'income-package-tasks' }
  ];
}
