import { MENU_TYPE } from './';
import { LAYOUT_TYPE } from './layout';

export const LAYOUTS = [
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
    columns: [{ width: '25%' }, {}, { width: '25%' }]
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
  }
];

export const TYPE_MENU = [
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

export const DASHBOARD_TYPE = {
  CASE_DETAILS: 'case-details',
  USER: 'user-dashboard',
  SITE: 'site-details'
};
