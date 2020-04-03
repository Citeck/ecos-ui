export const URL = {
  HOME: '/',
  JOURNAL: '/v2/journals',
  DASHBOARD: '/v2/dashboard',
  DASHBOARD_SETTINGS: '/v2/dashboard/settings',
  MENU_SETTINGS: '/v2/menu-settings',
  BPMN_DESIGNER: '/v2/bpmn-designer',
  TIMESHEET: '/v2/timesheet',
  TIMESHEET_SUBORDINATES: '/v2/timesheet/subordinates',
  TIMESHEET_FOR_VERIFICATION: '/v2/timesheet/for-verification',
  TIMESHEET_DELEGATED: '/v2/timesheet/delegated',
  TIMESHEET_IFRAME: '/v2/pure-timesheet',
  TIMESHEET_IFRAME_SUBORDINATES: '/v2/pure-timesheet/subordinates',
  TIMESHEET_IFRAME_FOR_VERIFICATION: '/v2/pure-timesheet/for-verification',
  TIMESHEET_IFRAME_DELEGATED: '/v2/pure-timesheet/delegated'
};

export const pagesWithOnlyContent = [
  URL.TIMESHEET_IFRAME,
  URL.TIMESHEET_IFRAME_SUBORDINATES,
  URL.TIMESHEET_IFRAME_FOR_VERIFICATION,
  URL.TIMESHEET_IFRAME_DELEGATED
];

export const SourcesId = {
  DASHBOARD: 'uiserv/dashboard',
  EFORM: 'uiserv/eform',
  USER_CONF: 'uiserv/user-conf',
  CONFIG: 'uiserv/config',
  HISTORY: 'history',
  STATUS: 'status',
  COMMENT: 'comment',
  VERSION: 'version',
  PEOPLE: 'people',
  BIRTHDAYS: 'birthdays'
};

export const ActionModes = {
  DASHBOARD: 'dashboard',
  JOURNAL: 'journal'
};

export const RequestStatuses = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};

export const DASHBOARD_DEFAULT_KEY = 'DEFAULT';

export const MIN_WIDTH_DASHLET_SMALL = 290;
export const MIN_WIDTH_DASHLET_LARGE = 593;

export const MAX_DEFAULT_HEIGHT_DASHLET = 800;
export const MIN_DEFAULT_HEIGHT_DASHLET = 155;

export const DataFormatTypes = {
  DATE: 'date',
  DATETIME: 'datetime',
  TEXT: 'text'
};

export const USER_CURRENT = '$CURRENT';
export const USER_ADMIN = 'admin';
export const USER_GUEST = 'guest';

export const LoaderTypes = {
  CIRCLE: 'circle',
  POINTS: 'points'
};

export const IMAGE_URL_PATH = '/share/proxy/alfresco/citeck/ecos/image/thumbnail';

export const DocScaleOptions = {
  AUTO: 'auto',
  PAGE_WHOLE: 'page-whole',
  PAGE_FIT: 'page-fit',
  PAGE_HEIGHT: 'page-height',
  PAGE_WIDTH: 'page-width'
};

export const Permissions = {
  Write: 'Write',
  Read: 'Read'
};
