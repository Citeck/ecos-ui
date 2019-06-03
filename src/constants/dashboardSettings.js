import { t } from '../helpers/util';

export const LAYOUT_TYPE = {
  TWO_COLUMNS_BS: '2-columns-big-small',
  TWO_COLUMNS_SB: '2-columns-small-big',
  THREE_COLUMNS_CB: '3-columns-center-big',
  FOUR_COLUMNS: '4-columns',
  ONE_COLUMN: '1-column',
  CUSTOM: 'custom'
};

export const MENU_TYPE = {
  LEFT: 'LEFT',
  TOP: 'TOP'
};

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

export const MENUS = [
  {
    position: 0,
    isActive: true,
    type: MENU_TYPE.LEFT,
    description: t('Меню слева')
  },
  {
    position: 1,
    isActive: false,
    type: MENU_TYPE.TOP,
    description: t('Меню в виде кнопок перед виджетами')
  }
];

export const SAVE_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};
