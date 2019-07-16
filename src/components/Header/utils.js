import { isEmpty } from 'lodash';

export function getIconClassMenu(id, specialClass) {
  switch (id) {
    case 'HEADER_USER_MENU_MY_PROFILE':
      return 'icon-User_avatar';
    case 'HEADER_USER_MENU_AVAILABILITY':
      return specialClass;
    case 'HEADER_USER_MENU_PASSWORD':
      return '';
    case 'HEADER_USER_MENU_FEEDBACK':
      return 'icon-notify-dialogue';
    case 'HEADER_USER_MENU_REPORTISSUE':
      return 'icon-big_alert';
    case 'HEADER_USER_MENU_LOGOUT':
      return 'icon-exit';
    case 'HEADER_SITE_INVITE':
      return '';
    case 'HEADER_CUSTOMIZE_SITE_DASHBOARD':
      return '';
    case 'HEADER_EDIT_SITE_DETAILS':
      return '';
    case 'HEADER_CUSTOMIZE_SITE':
      return '';
    case 'HEADER_LEAVE_SITE':
      return '';
    case 'HEADER_SITE_JOURNALS':
      return '';
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
        return params.available ? `icon-User_avatar_on ${colorOn}` : `icon-User_avatar_off ${colorOff}`;
      default:
        return false;
    }
  }

  return false;
}
