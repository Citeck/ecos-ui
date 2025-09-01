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
  MOBILE: 'mobile',
  ADAPTIVE_SAME_WIDGETS: 'adaptive-same-widgets'
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
  [LayoutTypes.MOBILE]: [[]],
  [LayoutTypes.ADAPTIVE_SAME_WIDGETS]: [[]]
};

export type LayoutTypeKey = (typeof LayoutTypes)[keyof typeof LayoutTypes];
export type DashboardTypeVal = (typeof DashboardTypes)[keyof typeof DashboardTypes];

export type Column = {
  width?: string;
  height?: string;
};
export type LayoutType = {
  position: number;
  type: LayoutTypeKey;
  isActive: boolean;
  excluded?: boolean;
  columns: Column[] | Array<Column[]>;
  allowedDashboards: DashboardTypeVal[];
  forbiddenDashboards: DashboardTypeVal[];
};

export const Layouts: LayoutType[] = [
  {
    position: 0,
    type: LayoutTypes.TWO_COLUMNS_BS,
    isActive: true,
    columns: [{}, { width: '25%' }],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },
  {
    position: 1,
    type: LayoutTypes.TWO_COLUMNS_SB,
    isActive: false,
    columns: [{ width: '25%' }, {}],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },
  {
    position: 2,
    type: LayoutTypes.THREE_COLUMNS_CB,
    isActive: false,
    columns: [{ width: '20%' }, {}, { width: '20%' }],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },
  {
    position: 3,
    type: LayoutTypes.FOUR_COLUMNS,
    isActive: false,
    columns: [{}, {}, {}, {}],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },
  {
    position: 4,
    type: LayoutTypes.ONE_COLUMN,
    isActive: false,
    columns: [{}],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },

  {
    position: 5,
    type: LayoutTypes.TWO_COLUMNS_BS_FOOTER,
    isActive: false,
    excluded: false,
    columns: [[{}, { width: '25%' }], [{ height: '20%' }]],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },
  {
    position: 6,
    type: LayoutTypes.TWO_COLUMNS_SB_FOOTER,
    isActive: false,
    excluded: false,
    columns: [[{ width: '25%' }, {}], [{}]],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },
  {
    position: 7,
    type: LayoutTypes.THREE_COLUMNS_CB_FOOTER,
    isActive: false,
    columns: [[{ width: '20%' }, {}, { width: '20%' }], [{}]],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },
  {
    position: 8,
    type: LayoutTypes.FOUR_COLUMNS_FOOTER,
    isActive: false,
    columns: [[{}, {}, {}, {}], [{}]],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },
  {
    position: 9,
    type: LayoutTypes.CLASSIC_SITE,
    isActive: false,
    columns: [[{}], [{}, {}, {}], [{}]],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },
  {
    position: 10,
    type: LayoutTypes.ADAPTIVE,
    isActive: false,
    columns: [{}],
    allowedDashboards: [DashboardTypes.PROFILE, DashboardTypes.ORGSTRUCTURE],
    forbiddenDashboards: []
  },
  {
    position: 11,
    type: LayoutTypes.ADAPTIVE_SAME_WIDGETS,
    isActive: false,
    columns: [{}],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  },

  {
    position: 999,
    type: LayoutTypes.MOBILE,
    isActive: false,
    excluded: true,
    columns: [{}],
    allowedDashboards: [],
    forbiddenDashboards: [DashboardTypes.ORGSTRUCTURE]
  }
];
