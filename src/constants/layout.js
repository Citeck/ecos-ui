import { DashboardTypes } from './dashboard';

export const LayoutTypes = {
  TWO_COLUMNS_BS: '2-columns-big-small',
  TWO_COLUMNS_SB: '2-columns-small-big',
  THREE_COLUMNS_CB: '3-columns-center-big',
  FOUR_COLUMNS: '4-columns',
  ONE_COLUMN: '1-column',
  TWO_COLUMNS_BS_FOOTER: '2-columns-big-small-with-footer',
  TWO_COLUMNS_SB_FOOTER: '2-columns-small-big-with-footer',
  THREE_COLUMNS_CB_FOOTER: '3-columns-center-big-with-footer',
  FOUR_COLUMNS_FOOTER: '4-columns-with-footer',
  CUSTOM: 'custom',
  FRANKENSTEIN: 'frankenstein',
  CLASSIC_SITE: 'classic-site',
  ADAPTIVE: 'adaptive',
  MOBILE: 'mobile'
};

export const MinColumnWidths = {
  ONE_QUARTER: '290px',
  TWO_QUARTERS: '‭345‬px',
  THREE_QUARTERS: '593px',
  FULL: '690px',
  AUTO: 'auto'
};

export const DefaultWidgetsByLayout = {
  [LayoutTypes.TWO_COLUMNS_BS]: [[], []],
  [LayoutTypes.TWO_COLUMNS_SB]: [[], []],
  [LayoutTypes.THREE_COLUMNS_CB]: [[], [], []],
  [LayoutTypes.FOUR_COLUMNS]: [[], [], [], []],
  [LayoutTypes.ONE_COLUMN]: [[]],
  [LayoutTypes.TWO_COLUMNS_BS_FOOTER]: [[], [], []],
  [LayoutTypes.TWO_COLUMNS_SB_FOOTER]: [[], [], []],
  [LayoutTypes.THREE_COLUMNS_CB_FOOTER]: [[], [], [], []],
  [LayoutTypes.FOUR_COLUMNS_FOOTER]: [[], [], [], [], []],
  [LayoutTypes.CLASSIC_SITE]: [[], [], [], [], []],
  [LayoutTypes.ADAPTIVE]: [[]],
  [LayoutTypes.MOBILE]: [[]]
};

export const Layouts = [
  {
    position: 0,
    type: LayoutTypes.TWO_COLUMNS_BS,
    isActive: true,
    columns: [{}, { width: '25%' }],
    allowedDashboards: []
  },
  {
    position: 1,
    type: LayoutTypes.TWO_COLUMNS_SB,
    isActive: false,
    columns: [{ width: '25%' }, {}],
    allowedDashboards: []
  },
  {
    position: 2,
    type: LayoutTypes.THREE_COLUMNS_CB,
    isActive: false,
    columns: [{ width: '20%' }, {}, { width: '20%' }],
    allowedDashboards: []
  },
  {
    position: 3,
    type: LayoutTypes.FOUR_COLUMNS,
    isActive: false,
    columns: [{}, {}, {}, {}],
    allowedDashboards: []
  },
  {
    position: 4,
    type: LayoutTypes.ONE_COLUMN,
    isActive: false,
    columns: [{}],
    allowedDashboards: []
  },

  {
    position: 5,
    type: LayoutTypes.TWO_COLUMNS_BS_FOOTER,
    isActive: false,
    excluded: false,
    columns: [[{}, { width: '25%' }], [{ height: '20%' }]],
    allowedDashboards: []
  },
  {
    position: 6,
    type: LayoutTypes.TWO_COLUMNS_SB_FOOTER,
    isActive: false,
    excluded: false,
    columns: [[{ width: '25%' }, {}], [{}]],
    allowedDashboards: []
  },
  {
    position: 7,
    type: LayoutTypes.THREE_COLUMNS_CB_FOOTER,
    isActive: false,
    columns: [[{ width: '20%' }, {}, { width: '20%' }], [{}]],
    allowedDashboards: []
  },
  {
    position: 8,
    type: LayoutTypes.FOUR_COLUMNS_FOOTER,
    isActive: false,
    columns: [[{}, {}, {}, {}], [{}]],
    allowedDashboards: []
  },
  {
    position: 9,
    type: LayoutTypes.CLASSIC_SITE,
    isActive: false,
    columns: [[{}], [{}, {}, {}], [{}]],
    allowedDashboards: []
  },
  {
    position: 10,
    type: LayoutTypes.ADAPTIVE,
    isActive: false,
    columns: [{}],
    allowedDashboards: [DashboardTypes.PROFILE]
  },

  {
    position: 999,
    type: LayoutTypes.MOBILE,
    isActive: false,
    excluded: true,
    columns: [{}],
    allowedDashboards: []
  }
];
