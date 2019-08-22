export const URL = {
  HOME: '/',
  JOURNAL_OLD: '/share/page/ui/journals',
  JOURNAL: '/v2/journals',
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
  WIDGET_EVENTS_HISTORY: '/v2/debug/events-history'
};

export const SourcesId = {
  DASHBOARD: 'uiserv/dashboard',
  HISTORY: 'history',
  STATUS: 'status',
  COMMENT: 'comment',
  VERSION: 'version',
  PEOPLE: 'people'
};

export const MENU_TYPE = {
  LEFT: 'LEFT',
  TOP: 'TOP'
};

export const SAVE_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};

export const DASHBOARD_DEFAULT_KEY = 'DEFAULT';

export const QueryKeys = {
  CONFIG_JSON: 'config?json',
  VALUE_JSON: 'value?json',
  KEY: 'key',
  VALUE: 'value',
  TITLE: 'title',
  DESCRIPTION: 'description'
};

export const MIN_WIDTH_DASHLET_SMALL = 290;
export const MIN_WIDTH_DASHLET_LARGE = 593;

export const MAX_DEFAULT_HEIGHT_DASHLET = 500;
export const MIN_DEFAULT_HEIGHT_DASHLET = 155;

export const DataFormatTypes = {
  DATE: 'date',
  DATETIME: 'datetime',
  TEXT: 'text'
};

export const USER_CURRENT = '$CURRENT';
export const USER_ADMIN = 'admin';
