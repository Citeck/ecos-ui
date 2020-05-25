import cloneDeep from 'lodash/cloneDeep';

import { deepClone, isExistValue, t } from '../helpers/util';
import { treeFindFirstItem } from '../helpers/arrayOfObjects';
import { MenuSettings as ms } from '../constants/menu';

export default class MenuSettingsService {
  static defaultItemProps = {
    icon: { value: 'icon-empty-icon', type: 'icon' },
    visible: true,
    editable: true,
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
        when: { visible: true }
      });
    }

    if (item.removable) {
      actions.push({
        type: ms.ActionTypes.DELETE,
        icon: 'icon-delete',
        text: 'menu-settings.editor-items.action.delete',
        className: 'ecos-menu-settings-editor-items__action_caution',
        when: { visible: true }
      });
    }

    actions.push(
      {
        type: ms.ActionTypes.ACTIVE,
        icon: 'icon-on',
        className: 'ecos-menu-settings-editor-items__action_no-hide',
        when: { visible: true },
        text: 'menu-settings.editor-items.action.hide'
      },
      {
        type: ms.ActionTypes.NO_ACTIVE,
        icon: 'icon-off',
        className: 'ecos-menu-settings-editor-items__action_no-hide',
        when: { visible: false },
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
        foundItem.visible = !foundItem.visible;
        foundItem.locked = !foundItem.visible;
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

    return availableActions.filter(act => !isExistValue(act.when.visible) || act.when.visible === item.visible);
  }

  static createOptions = [
    {
      key: ms.OptionKeys.SECTION,
      forbiddenTypes: [],
      label: 'menu-item.type.section'
    },
    {
      key: ms.OptionKeys.JOURNAL,
      forbiddenTypes: [],
      forbiddenAllTypes: true,
      label: 'menu-item.type.journal'
    },
    {
      key: ms.OptionKeys.ARBITRARY,
      forbiddenAllTypes: true,
      label: 'menu-item.type.arbitrary'
    },
    {
      key: ms.OptionKeys.LINK_CREATE_CASE,
      forbiddenAllTypes: true,
      label: 'menu-item.type.link-create-case'
    },
    {
      key: ms.OptionKeys.HEADER_DIVIDER,
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
    console.log(item);
    console.log([ms.OptionKeys.SECTION].includes(item.type));
    return ![ms.OptionKeys.SECTION].includes(item.type);
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
