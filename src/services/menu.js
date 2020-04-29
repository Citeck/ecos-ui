import { select } from 'redux-saga/effects';
import uniqueId from 'lodash/uniqueId';

import { selectIdentificationForView } from '../selectors/dashboard';
import { deepClone, t } from '../helpers/util';
import { getSearchParams, SearchKeys } from '../helpers/urls';

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
    EDIT: 'EDIT',
    DELETE: 'DELETE'
  };

  static getAvailableActions = item => {
    const actions = [];

    if (item.editable) {
      actions.push({
        type: MenuService.ActionTypes.EDIT,
        icon: 'icon-edit'
      });
    }

    if (item.removable) {
      actions.push({
        type: MenuService.ActionTypes.DELETE,
        icon: 'icon-delete',
        className: 'ecos-menu-settings-editor-items__action_caution',
        onClick: () => null
      });
    }

    actions.push({
      type: MenuService.ActionTypes.ACTIVE,
      icon: 'icon-on',
      className: 'ecos-menu-settings-editor-items__action_no-hide',
      onClick: () => null
    });

    return actions;
  };

  static setActionConfig = items => {
    items.forEach(item => {
      item.actionConfig = MenuService.getAvailableActions(item);
      item.items && MenuService.setActionConfig(item.items);
    });
  };

  static extraCreateOptions = [
    {
      forbiddenTypes: [],
      label: 'menu-item.type.arbitrary'
    },
    {
      forbiddenTypes: [],
      label: 'menu-item.type.link-to-create-case'
    },
    {
      forbiddenTypes: [],
      label: 'menu-item.type.header-divider'
    }
  ];

  static getAvailableCreateOptions = (options, item) => {
    const array = deepClone(options);

    array.forEach(item => {
      item.id = item.id || item.label;
      item.label = t(item.label);
    });

    return array.filter(opt => !item || !opt.forbiddenTypes.includes(item.type));
  };

  static testItems = Array(3).fill({
    id: uniqueId('menu-'),
    name: 'test',
    icon: { value: 'icon' },
    selected: true,
    editable: true,
    removable: true,
    draggable: true,
    expandable: true,
    items: [
      {
        id: uniqueId('submenu-'),
        name: 'child',
        selected: true,
        editable: true,
        removable: true,
        draggable: true,
        items: []
      },
      {
        id: uniqueId('submenu-'),
        name: 'child',
        items: []
      }
    ]
  });

  static testCreateOptions = [
    {
      id: '1111',
      forbiddenTypes: [],
      label: 'Договоры'
    },
    {
      id: '22222',
      forbiddenTypes: [],
      label: 'Журналы'
    }
  ];
}
