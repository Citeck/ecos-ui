import { select } from 'redux-saga/effects';
import cloneDeep from 'lodash/cloneDeep';

import { selectIdentificationForView } from '../selectors/dashboard';
import { deepClone, t } from '../helpers/util';
import { getSearchParams, SearchKeys } from '../helpers/urls';
import { treeFindFirstItem } from '../helpers/arrayOfObjects';
import { toGeneratorTree } from '../helpers/dataGenerators';

export default class MenuService {
  static getSiteMenuLink = function*(menuItem) {
    const dashboard = yield select(selectIdentificationForView);
    const { recordRef, dashboardKey } = getSearchParams();
    const params = [];
    let link = menuItem.targetUrl;

    if (menuItem.id === 'SETTINGS_DASHBOARD') {
      params.push(`${SearchKeys.DASHBOARD_ID}=${dashboard.id}`);

      if (recordRef) {
        params.push(`${SearchKeys.RECORD_REF}=${recordRef}`);
      }

      if (dashboardKey) {
        params.push(`${SearchKeys.DASHBOARD_KEY}=${dashboardKey}`);
      }
    }

    link += `?${params.join('&')}`;

    return link;
  };

  static ActionTypes = {
    ACTIVE: 'ACTIVE',
    NO_ACTIVE: 'NO_ACTIVE',
    EDIT: 'EDIT',
    DELETE: 'DELETE'
  };

  static getAvailableActions = item => {
    const actions = [];

    //if whenSelected == null it is both states
    if (item.editable) {
      actions.push({
        type: MenuService.ActionTypes.EDIT,
        icon: 'icon-edit',
        text: 'menu-settings.editor-items.action.edit',
        whenSelected: true
      });
    }

    if (item.removable) {
      actions.push({
        type: MenuService.ActionTypes.DELETE,
        icon: 'icon-delete',
        text: 'menu-settings.editor-items.action.delete',
        className: 'ecos-menu-settings-editor-items__action_caution',
        whenSelected: true
      });
    }

    actions.push(
      {
        type: MenuService.ActionTypes.ACTIVE,
        icon: 'icon-on',
        className: 'ecos-menu-settings-editor-items__action_no-hide',
        whenSelected: true,
        text: 'menu-settings.editor-items.action.hide'
      },
      {
        type: MenuService.ActionTypes.NO_ACTIVE,
        icon: 'icon-off',
        className: 'ecos-menu-settings-editor-items__action_no-hide',
        whenSelected: false,
        text: 'menu-settings.editor-items.action.show'
      }
    );

    return actions;
  };

  static setAvailableActions = items => {
    items.forEach(item => {
      item.availableActions = MenuService.getAvailableActions(item);
      item.items && MenuService.setAvailableActions(item.items);
    });
  };

  static processAction = ({ items: original, action, id }) => {
    const items = cloneDeep(original);
    const foundItem = treeFindFirstItem({ items, key: 'id', value: id });

    switch (action) {
      case MenuService.ActionTypes.ACTIVE:
      case MenuService.ActionTypes.NO_ACTIVE:
        foundItem.selected = !foundItem.selected;
        foundItem.actionConfig = foundItem.availableActions
          ? foundItem.availableActions.filter(act => !!act.whenSelected === foundItem.selected)
          : [];
        break;
      case MenuService.ActionTypes.DELETE:
        break;
      default:
        break;
    }

    return items;
  };

  static setActiveActions(items) {
    for (const item of items) {
      item.actionConfig = item.availableActions
        ? item.availableActions.filter(act => act.whenSelected == null || act.whenSelected === item.selected)
        : [];
      item.items && MenuService.setActiveActions(item.items);
    }

    return items;
  }

  static extraCreateOptions = [
    {
      key: 'section',
      forbiddenTypes: [],
      label: 'Раздел'
    },
    {
      key: 'journal',
      forbiddenTypes: [],
      label: 'Журнал'
    },
    {
      key: 'arbitrary',
      forbiddenTypes: [],
      label: 'menu-item.type.arbitrary'
    },
    {
      key: 'link-create-case',
      forbiddenTypes: [],
      label: 'menu-item.type.link-create-case'
    },
    {
      key: 'header-divider',
      forbiddenTypes: [],
      label: 'menu-item.type.header-divider'
    }
  ];

  static getAvailableCreateOptions = (options, item) => {
    const array = deepClone(options || []);

    array.forEach(item => {
      item.id = item.id || item.label;
      item.label = t(item.label);
    });

    return array.filter(opt => !item || !opt.forbiddenTypes.includes(item.type));
  };

  static testItems = toGeneratorTree(5, 2);

  static testCreateOptions = [
    {
      id: '1111',
      forbiddenTypes: [],
      label: 'Раздел'
    },
    {
      id: '22222',
      forbiddenTypes: [],
      label: 'Журнал'
    }
  ];
}
