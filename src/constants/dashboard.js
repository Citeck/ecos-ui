import { MENU_TYPE } from './';
import { LAYOUT_TYPE } from './layout';

export const Layouts = [
  {
    position: 0,
    type: LAYOUT_TYPE.TWO_COLUMNS_BS,
    isActive: true,
    columns: [{}, { width: '25%' }]
  },
  {
    position: 1,
    type: LAYOUT_TYPE.TWO_COLUMNS_SB,
    isActive: false,
    columns: [{ width: '25%' }, {}]
  },
  {
    position: 2,
    type: LAYOUT_TYPE.THREE_COLUMNS_CB,
    isActive: false,
    columns: [{ width: '20%' }, {}, { width: '20%' }]
  },
  {
    position: 3,
    type: LAYOUT_TYPE.FOUR_COLUMNS,
    isActive: false,
    columns: [{}, {}, {}, {}]
  },
  {
    position: 4,
    type: LAYOUT_TYPE.ONE_COLUMN,
    isActive: false,
    columns: [{}]
  },

  {
    position: 5,
    type: LAYOUT_TYPE.TWO_COLUMNS_BS_FOOTER,
    isActive: false,
    excluded: false,
    columns: [[{}, { width: '25%' }], [{ height: '20%' }]]
  },
  {
    position: 6,
    type: LAYOUT_TYPE.TWO_COLUMNS_SB_FOOTER,
    isActive: false,
    excluded: false,
    columns: [[{ width: '25%' }, {}], [{}]]
  },
  {
    position: 7,
    type: LAYOUT_TYPE.THREE_COLUMNS_CB_FOOTER,
    isActive: false,
    columns: [[{ width: '20%' }, {}, { width: '20%' }], [{}]]
  },
  {
    position: 8,
    type: LAYOUT_TYPE.FOUR_COLUMNS_FOOTER,
    isActive: false,
    columns: [[{}, {}, {}, {}], [{}]]
  },
  {
    position: 9,
    type: LAYOUT_TYPE.CLASSIC_SITE,
    isActive: false,
    columns: [[{}], [{}, {}, {}], [{}]]
  },
  {
    position: 10,
    type: LAYOUT_TYPE.ADAPTIVE,
    isActive: false,
    // columns: [{ width: '20%' }, {}, { width: '20%' }]
    columns: [{}]
  },

  {
    position: 999,
    type: LAYOUT_TYPE.MOBILE,
    isActive: false,
    excluded: true,
    columns: [{}]
  }
];

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
