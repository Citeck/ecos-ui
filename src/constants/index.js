export const URL = {
  HOME: '/',
  JOURNAL_OLD: '/share/page/ui/journals',
  JOURNAL: '/share/page/ui/journals',
  DASHBOARD: '/v2/dashboard',
  DASHBOARD_SETTINGS: '/v2/dashboard/settings',
  BPMN_DESIGNER: '/v2/bpmn-designer',

  // temporary pages
  CARD_DETAILS: '/v2/(.*/)?card-details',
  JOURNAL_DASHBOARD: '/v2/debug/journalsDashboard',
  WIDGET_TASKS: '/v2/debug/tasks',
  WIDGET_COMMENTS: '/v2/debug/comments',
  WIDGET_PROPERTIES: '/v2/debug/properties',
  WIDGET_DOC_PREVIEW: '/v2/debug/doc-preview',
  CURRENT_TASKS: '/v2/debug/current-tasks',
  WIDGET_DOC_STATUS: '/v2/debug/doc-status',
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
  DASHBOARD: 'uiserv/dashboard'
};

export const MENU_TYPE = {
  LEFT: 'LEFT',
  TOP: 'TOP'
};

export const SAVE_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};

export const QueryKeys = {
  CONFIG_JSON: 'config?json',
  VALUE_JSON: 'value?json',
  KEY: 'key',
  VALUE: 'value',
  TITLE: 'title',
  DESCRIPTION: 'description',
  DEFAULT: 'DEFAULT'
};

export const MIN_WIDTH_DASHLET_SMALL = 290;
export const MIN_WIDTH_DASHLET_LARGE = 593;

export const MAX_DEFAULT_HEIGHT_DASHLET = 500;
export const MIN_DEFAULT_HEIGHT_DASHLET = 155;

export const DataFormatTypes = {
  DATE: 'date',
  TEXT: 'text'
};

export const USER_CURRENT = '$CURRENT';
export const USER_ADMIN = 'admin';
