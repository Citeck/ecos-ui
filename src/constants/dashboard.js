import { t } from '../helpers/util';

export const LAYOUT_TYPE = {
  TEMPLATE: 'TEMPLATE',
  MENU: 'MENU'
};

export const MENU_POSITION = {
  LEFT: 'LEFT',
  TOP: 'TOP'
};

export const LAYOUTS = [
  {
    position: 0,
    type: '2-columns-big-small',
    isActive: true,
    columns: [{}, { width: '25%' }]
  },
  {
    position: 1,
    type: '2-columns-small-big',
    isActive: false,
    columns: [{ width: '25%' }, {}]
  },
  {
    position: 2,
    type: '3-columns-center-big',
    isActive: false,
    columns: [{ width: '25%' }, {}, { width: '25%' }]
  },
  {
    position: 3,
    type: '4-columns',
    isActive: false,
    columns: [{}, {}, {}, {}]
  },
  {
    position: 4,
    type: '1-column',
    isActive: false,
    columns: [{}]
  }
];

export const MENUS = [
  {
    position: 0,
    isActive: true,
    type: MENU_POSITION.LEFT,
    description: t('Меню слева')
  },
  {
    position: 1,
    isActive: false,
    type: MENU_POSITION.TOP,
    description: t('Меню в виде кнопок перед виджетами')
  }
];
