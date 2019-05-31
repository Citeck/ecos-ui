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
    isActive: true,
    columns: [{}, { width: '25%' }]
  },
  {
    position: 1,
    isActive: false,
    columns: [{ width: '25%' }, {}]
  },
  {
    position: 2,
    isActive: false,
    columns: [{ width: '25%' }, {}, { width: '25%' }]
  },
  {
    position: 3,
    isActive: false,
    columns: [{}, {}, {}, {}]
  },
  {
    position: 4,
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
