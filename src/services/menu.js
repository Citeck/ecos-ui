import { select } from 'redux-saga/effects';
import cloneDeep from 'lodash/cloneDeep';

import { selectIdentificationForView } from '../selectors/dashboard';
import { deepClone, t } from '../helpers/util';
import { getSearchParams, SearchKeys } from '../helpers/urls';
import { treeFindFirstItem } from '../helpers/arrayOfObjects';
import { toGeneratorTree } from '../helpers/dataGenerators';
import { MenuSettings as ms } from '../constants/menu';

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

  static getAvailableActions = item => {
    const actions = [];

    //if whenSelected == null it is both states
    if (item.editable) {
      actions.push({
        type: ms.ActionTypes.EDIT,
        icon: 'icon-edit',
        text: 'menu-settings.editor-items.action.edit',
        whenSelected: true
      });
    }

    if (item.removable) {
      actions.push({
        type: ms.ActionTypes.DELETE,
        icon: 'icon-delete',
        text: 'menu-settings.editor-items.action.delete',
        className: 'ecos-menu-settings-editor-items__action_caution',
        whenSelected: true
      });
    }

    actions.push(
      {
        type: ms.ActionTypes.ACTIVE,
        icon: 'icon-on',
        className: 'ecos-menu-settings-editor-items__action_no-hide',
        whenSelected: true,
        text: 'menu-settings.editor-items.action.hide'
      },
      {
        type: ms.ActionTypes.NO_ACTIVE,
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
      case ms.ActionTypes.ACTIVE:
      case ms.ActionTypes.NO_ACTIVE:
        foundItem.selected = !foundItem.selected;
        foundItem.actionConfig = foundItem.availableActions
          ? foundItem.availableActions.filter(act => !!act.whenSelected === foundItem.selected)
          : [];
        break;
      case ms.ActionTypes.DELETE:
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
      forbiddenTypes: [],
      forbiddenAllTypes: true,
      label: 'menu-item.type.arbitrary'
    },
    {
      key: ms.OptionKeys.LINK_CREATE_CASE,
      forbiddenTypes: [],
      forbiddenAllTypes: true,
      label: 'menu-item.type.link-create-case'
    },
    {
      key: ms.OptionKeys.HEADER_DIVIDER,
      forbiddenTypes: [],
      forbiddenAllTypes: true,
      label: 'menu-item.type.header-divider'
    }
  ];

  static getAvailableCreateOptions = (options, item) => {
    const array = deepClone(options || []);

    array.forEach(item => {
      item.id = item.id || item.label;
      item.label = t(item.label);
    });

    return array.filter(opt => !item || !!opt.forbiddenAllTypes || !opt.forbiddenTypes.includes(item.type));
  };

  static testItems = toGeneratorTree(5, 2);
}
