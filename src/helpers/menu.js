import isEmpty from 'lodash/isEmpty';

import { URL } from '../constants';
import { BASE_LEFT_MENU_ID, MenuTypes } from '../constants/menu';
import MenuSettingsService from '../services/MenuSettingsService';
import DashboardService from '../services/dashboard';
import { documentScrollTop } from './util';

export function processMenuItemsFromOldMenu(oldMenuItems) {
  let siteMenuItems = [];

  for (let item of oldMenuItems) {
    if (!item.config) {
      continue;
    }

    let newItem = {
      id: item.id,
      label: item.config.label,
      isLegacy: true
    };

    if (item.config.targetUrl) {
      if (item.config.targetUrlType && item.config.targetUrlType === 'FULL_PATH') {
        newItem.targetUrl = item.config.targetUrl;
      }

      if (item.config.targetUrlLocation && item.config.targetUrlLocation === 'NEW') {
        newItem.target = '_blank';
      }
    }

    if (item.config.publishTopic) {
      newItem.control = {
        type: item.config.publishTopic
      };

      if (item.config.publishPayload) {
        newItem.control.payload = item.config.publishPayload;
      }
    }

    siteMenuItems.push(newItem);
  }

  return siteMenuItems;
}

export function makeSiteMenu(params = {}) {
  const { isAdmin, isDashboardPage, dashboardEditable, leftMenuEditable } = params || {};
  const menu = [
    // {
    //   id: 'HOME_PAGE',
    //   label: 'header.site-menu.home-page',
    //   targetUrl: URL.DASHBOARD,
    //   targetUrlType: 'FULL_PATH'
    // },
    {
      id: 'SETTINGS_DASHBOARD',
      label: 'header.site-menu.page-settings',
      onClick: params => {
        DashboardService.openEditModal(params);
      }
    },
    // {
    //   id: 'SETTINGS_DASHBOARD',
    //   label: 'Настроить страницу в новой вкладке',
    //   targetUrl: URL.DASHBOARD_SETTINGS,
    //   targetUrlType: 'FULL_PATH'
    // },
    {
      id: 'SETTINGS_MENU',
      label: 'header.site-menu.menu-settings',
      onClick: () => {
        MenuSettingsService.emitter.emit(MenuSettingsService.Events.SHOW);
      }
    },
    {
      id: 'GO_ADMIN_PAGE',
      label: 'header.site-menu.admin-page',
      targetUrl: URL.ADMIN_PAGE,
      targetUrlType: 'FULL_PATH'
    }
  ];

  if (!params) {
    return menu;
  }

  return menu.filter(item => {
    switch (item.id) {
      case 'SETTINGS_DASHBOARD':
        return dashboardEditable && isDashboardPage;
      case 'SETTINGS_MENU':
        return leftMenuEditable;
      case 'GO_ADMIN_PAGE':
        return isAdmin;
      default:
        return true;
    }
  });
}

export function getIconClassMenu(id, specialClass) {
  switch (id) {
    case 'HEADER_USER_MENU_MY_PROFILE':
      return 'icon-user-normal';
    case 'HEADER_USER_MENU_EDIT_PASSWORD':
      return 'icon-edit';
    case 'HEADER_USER_MENU_AVAILABILITY':
      return specialClass || '';
    case 'HEADER_USER_MENU_FEEDBACK':
      return 'icon-notify';
    case 'HEADER_USER_MENU_REPORTISSUE':
      return 'icon-alert';
    case 'HEADER_USER_MENU_LOGOUT':
      return 'icon-exit';
    case 'HEADER_USER_MENU_PASSWORD':
    case 'HEADER_SITE_INVITE':
    case 'HEADER_CUSTOMIZE_SITE_DASHBOARD':
    case 'HEADER_EDIT_SITE_DETAILS':
    case 'HEADER_CUSTOMIZE_SITE':
    case 'HEADER_LEAVE_SITE':
    case 'HEADER_SITE_JOURNALS':
    default:
      return '';
  }
}

export function getSpecialClassByState(id, params = {}) {
  if (!isEmpty(params)) {
    const colorOn = 'icon_on';
    const colorOff = 'icon_off';

    switch (id) {
      case 'HEADER_USER_MENU_AVAILABILITY':
        return params.available ? `icon-user-online ${colorOn}` : `icon-user-away ${colorOff}`;
      default:
        return false;
    }
  }

  return false;
}

export function getMenuWidth(selector = `#${BASE_LEFT_MENU_ID}`) {
  const menu = document.querySelector(selector);

  if (!menu || !menu.clientWidth) {
    return 0;
  }

  return -menu.clientWidth;
}

export function getPositionAdjustment(menuType) {
  return {
    top: menuType === MenuTypes.LEFT ? documentScrollTop() : 0,
    left: menuType === MenuTypes.LEFT ? getMenuWidth() : 0
  };
}
