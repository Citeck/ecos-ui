import { PROXY_URI } from './alfresco';

export const URL = {
  HOME: '/',
  JOURNAL: '/v2/journals',
  DASHBOARD: '/v2/dashboard',
  DASHBOARD_SETTINGS: '/v2/dashboard/settings',
  MENU_SETTINGS: '/v2/menu-settings',
  ADMIN_PAGE: '/v2/admin',
  BPMN_DESIGNER: '/v2/bpmn-designer', // @deprecated
  BPMN_EDITOR: '/v2/bpmn-editor',
  CMMN_EDITOR: '/v2/cmmn-editor',
  DEV_TOOLS: '/v2/dev-tools',
  TIMESHEET: '/v2/timesheet',
  TIMESHEET_SUBORDINATES: '/v2/timesheet/subordinates',
  TIMESHEET_FOR_VERIFICATION: '/v2/timesheet/for-verification',
  TIMESHEET_DELEGATED: '/v2/timesheet/delegated',
  TIMESHEET_IFRAME: '/v2/pure-timesheet',
  TIMESHEET_IFRAME_SUBORDINATES: '/v2/pure-timesheet/subordinates',
  TIMESHEET_IFRAME_FOR_VERIFICATION: '/v2/pure-timesheet/for-verification',
  TIMESHEET_IFRAME_DELEGATED: '/v2/pure-timesheet/delegated',
  FORM_COMPONENTS: '/v2/debug/formio-develop'
};

export const pagesWithOnlyContent = [
  URL.TIMESHEET_IFRAME,
  URL.TIMESHEET_IFRAME_SUBORDINATES,
  URL.TIMESHEET_IFRAME_FOR_VERIFICATION,
  URL.TIMESHEET_IFRAME_DELEGATED
];

export const SourcesId = {
  ADMIN_PAGE_SECTION: 'uiserv/admin-page-section',
  BUILD_INFO: 'uiserv/build-info',
  DASHBOARD: 'uiserv/dashboard',
  DOCLIB: 'alfresco/doclib',
  EFORM: 'uiserv/eform',
  USER_CONF: 'uiserv/user-conf',
  CONFIG: 'uiserv/config',
  MENU: 'uiserv/menu',
  RESOLVED_MENU: 'uiserv/rmenu',
  ICON: 'uiserv/icon',
  PREDICATE: 'uiserv/predicate',
  THEME: 'uiserv/theme',
  META: 'uiserv/meta',
  JOURNAL: 'uiserv/journal',
  RESOLVED_JOURNAL: 'uiserv/rjournal',
  TYPE: 'emodel/type',
  FONT_ICON: 'ui/icon',
  A_AUTHORITY: 'alfresco/authority',
  A_META: 'alfresco/meta',
  ECOS_CONFIG: 'ecos-config',
  HISTORY: 'history',
  STATUS: 'status',
  COMMENT: 'comment',
  VERSION: 'version',
  PEOPLE: 'people',
  BIRTHDAYS: 'birthdays',
  REPORT: 'reports-data',
  TASK: 'wftask',
  WORKFLOW: 'workflow'
};

export const EmodelTypes = {
  USER_DASHBOARD: 'emodel/type@user-dashboard',
  BASE: 'emodel/type@base'
};

export const ActionModes = {
  DASHBOARD: 'dashboard',
  JOURNAL: 'journal'
};

export const RequestStatuses = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};

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

export const IMAGE_URL_PATH = `${PROXY_URI}citeck/ecos/image/thumbnail`;

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

export const MOBILE_APP_USER_AGENT = 'ecos-mobile-app';

export const Attributes = {
  DBID: 'sys:node-dbid'
};

export const TMP_ICON_EMPTY = 'icon-empty';

export const Pages = {
  DASHBOARD_SETTINGS: 'dashboard-settings',
  DASHBOARD: 'dashboard',
  BPMN: 'bpmn',
  JOURNAL: 'journal',
  TIMESHEET_MY: 'timesheet-my',
  TIMESHEET_SUBORDINATES: 'timesheet-subordinates',
  TIMESHEET_VERIFICATION: 'timesheet-verification',
  TIMESHEET_DELEGATED: 'timesheet-delegated',
  LOGIN: 'login',
  DEBUG_FORMIO: 'debug-formio',
  DEBUG_TREE: 'debug-tree',
  DEBUG_CMMN: 'debug-cmnne',
  CMMN_EDITOR: 'cmmn-editor',
  BPMN_EDITOR: 'bpmn-editor',
  DEV_TOOLS: 'dev-tools'
};

export const AppEditions = {
  ENTERPRISE: 'enterprise'
};

export const JournalUrlParams = {
  JOURNALS_LIST_ID: 'journalsListId',
  JOURNAL_ID: 'journalId',
  RECORD_REF: 'recordRef',
  JOURNAL_SETTING_ID: 'journalSettingId',
  USER_CONFIG_ID: 'userConfigId',
  SHOW_PREVIEW: 'showPreview',
  SEARCH: 'search',
  VIEW_MODE: 'viewMode',
  DOCLIB_FOLDER_ID: 'folderId',
  DOCLIB_SEARCH: 'dlSearch'
};

export const SYSTEM_LIST = 'global-system';

export const SystemJournals = {
  JOURNALS: 'ecos-journals',
  TYPES: 'ecos-types',
  MENUS: 'ecos-menus'
};

window.Citeck = window.Citeck || {};
window.Citeck.constants = window.Citeck.constants || {};
window.Citeck.constants = { ...window.Citeck.constants, URL, SourcesId };
