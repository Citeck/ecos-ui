import { MENU_TYPE } from './';

export const MenuTypes = [
  {
    position: 0,
    isActive: true,
    type: MENU_TYPE.LEFT,
    description: 'dashboard-settings.menu-type1'
  },
  {
    position: 1,
    isActive: false,
    type: MENU_TYPE.TOP,
    description: 'dashboard-settings.menu-type2'
  }
];

export const DashboardTypes = {
  CASE_DETAILS: 'case-details',
  USER: 'user-dashboard',
  SITE: 'site-details',
  PROFILE: 'profile-details'
};

export const DeviceTabs = [
  {
    key: 'desktop',
    label: 'dashboard-settings.tabs.desktop'
  },
  {
    key: 'mobile',
    label: 'dashboard-settings.tabs.mobile'
  }
];
