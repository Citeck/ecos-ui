import { SectionTypes } from './adminSection';
import { CITECK_URI } from './alfresco';

export const DEFAULT_EIS = Object.freeze({
  EIS_ID: 'EIS_ID',
  LOGOUT_URL: 'LOGOUT_URL'
});

export const MAX_WORKSPACE_PREVIEW_ITEMS = 8;
export const BASE_URLS_REDIRECT = ['/', '/v2', '/v2/'];

export const ADMIN_WORKSPACE_ID = 'admin$workspace';

export const URL = {
  HOME: '/',
  JOURNAL: '/v2/journals',
  DASHBOARD: '/v2/dashboard',
  /** @deprecated */
  DASHBOARD_SETTINGS: '/v2/dashboard/settings',
  /** @deprecated */
  MENU_SETTINGS: '/v2/menu-settings',
  ADMIN_PAGE: '/v2/admin',
  /** @deprecated */
  BPMN_DESIGNER: '/v2/bpmn-designer',
  BPMN_ADMIN_PROCESS: '/v2/bpmn-process',
  BPMN_ADMIN_INSTANCE: '/v2/bpmn-instance',
  BPMN_MIGRATION: '/v2/bpmn-migration',
  BPMN_EDITOR: '/v2/bpmn-editor',
  CMMN_EDITOR: '/v2/cmmn-editor',
  DMN_EDITOR: '/v2/dmn-editor',
  DEV_TOOLS: '/v2/dev-tools',
  TIMESHEET: '/v2/timesheet',
  TIMESHEET_SUBORDINATES: '/v2/timesheet/subordinates',
  TIMESHEET_FOR_VERIFICATION: '/v2/timesheet/for-verification',
  TIMESHEET_DELEGATED: '/v2/timesheet/delegated',
  TIMESHEET_IFRAME: '/v2/pure-timesheet',
  TIMESHEET_IFRAME_SUBORDINATES: '/v2/pure-timesheet/subordinates',
  TIMESHEET_IFRAME_FOR_VERIFICATION: '/v2/pure-timesheet/for-verification',
  TIMESHEET_IFRAME_DELEGATED: '/v2/pure-timesheet/delegated',
  FORM_COMPONENTS: '/v2/debug/formio-develop',
  ORGSTRUCTURE: '/v2/orgstructure'
};

export const RELOCATED_URL = {
  [URL.BPMN_DESIGNER]: `${URL.ADMIN_PAGE}?type=${SectionTypes.BPM}`
  // [URL.BPMN_DESIGNER]: URL.ADMIN_PAGE
};

export const URL_MATCHING = {
  [URL.DEV_TOOLS]: URL.ADMIN_PAGE,
  [`${URL.ADMIN_PAGE}?type=${SectionTypes.BPM}`]: URL.BPMN_DESIGNER,
  [URL.BPMN_DESIGNER]: `${URL.ADMIN_PAGE}?type=${SectionTypes.BPM}`
};

export const pagesWithOnlyContent = [
  URL.TIMESHEET_IFRAME,
  URL.TIMESHEET_IFRAME_SUBORDINATES,
  URL.TIMESHEET_IFRAME_FOR_VERIFICATION,
  URL.TIMESHEET_IFRAME_DELEGATED
];

export const SourcesId = {
  ADMIN_PAGE_SECTION: 'uiserv/admin-page-section',
  EAPPS_BUILD_INFO: 'eapps/build-info',
  DASHBOARD: 'uiserv/dashboard',
  DOCLIB: 'emodel/doclib',
  RESOLVED_FORM: 'uiserv/rform',
  FORM: 'uiserv/form',
  USER_CONF: 'uiserv/user-conf',
  MENU: 'uiserv/menu',
  RESOLVED_MENU: 'uiserv/rmenu',
  ICON: 'uiserv/icon',
  PREDICATE: 'uiserv/predicate',
  THEME: 'uiserv/theme',
  META: 'uiserv/meta',
  JOURNAL: 'uiserv/journal',
  RESOLVED_JOURNAL: 'uiserv/rjournal',
  JOURNAL_SERVICE: 'uiserv/journals-service',
  BOARD: 'uiserv/board',
  RESOLVED_BOARD: 'uiserv/rboard',
  RESOLVED_TYPE: 'emodel/rtype',
  WORKSPACE: 'emodel/workspace',
  WORKSPACE_SERVICE: 'emodel/workspace-service',
  TYPE: 'emodel/type',
  FONT_ICON: 'ui/icon',
  MODEL_META: 'emodel/meta',
  A_META: 'alfresco/meta',
  A_WORKFLOW: 'alfresco/workflow',
  HISTORY: 'history',
  STATUS: 'status',
  LEGACY_COMMENT: 'comment',
  EMODEL_COMMENT: 'emodel/comment',
  EMODEL_ACTIVITY: 'emodel/activity',
  EMODEL_ACTIVITY_TYPE: 'emodel/activity-type',
  VERSION: 'emodel/version',
  VERSION_DIFF: 'emodel/version-diff',
  BIRTHDAYS: 'birthdays',
  REPORT: 'reports-data',
  TASK: 'eproc/wftask',
  TASK_FORM: 'uiserv/task-form',
  WORKFLOW: 'workflow',
  BPMN_DEF: 'eproc/bpmn-def',
  BPMN_PROC: 'eproc/bpmn-proc',
  BPMN_STAT: 'eproc/bpmn-process-elements',
  BPMN_KPI: 'emodel/bpmn-kpi-value',
  BPMN_PROC_LATEST: 'eproc/bpmn-proc-latest',
  ACTION: 'uiserv/action',
  PRESETS: 'uiserv/journal-settings',
  GROUP: 'emodel/authority-group',
  PERSON: 'emodel/person',
  PROC_TASK: 'eproc/proc-task',
  PROC_HISTORIC_TASK: 'eproc/proc-historic-task',
  DOCUMENTS: 'emodel/documents',
  SEARCH: 'emodel/search',
  get CURRENT_USER() {
    return `${SourcesId.PERSON}@CURRENT`;
  },
  get HISTORY_REC() {
    return `${SourcesId.HISTORY}/history-record`;
  }
};

export const QueryLanguages = {
  TASKS: 'tasks',
  FORM: 'form'
};

export const EmodelTypes = {
  USER_DASHBOARD: 'emodel/type@user-dashboard',
  CUSTOM_DASHBOARD: 'emodel/type@custom-dashboard',
  BASE: 'emodel/type@base',
  HISTORY_REC: 'emodel/type@history-record',
  WS_DASHBOARD: 'emodel/type@workspace-dashboard',
  PERSONAL_WS_DASHBOARD: 'emodel/type@personal-workspace-dashboard'
};

export const ActionModes = {
  DASHBOARD: 'dashboard',
  JOURNAL: 'journal'
};

export const RequestStatuses = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  RESET: 'RESET'
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

export const IMAGE_URL_PATH = `${CITECK_URI}ecos/image/thumbnail`;

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
  DBID: 'sys:node-dbid',
  CREATED: '_created'
};

export const TMP_ICON_EMPTY = 'icon-empty';

export const Pages = {
  DASHBOARD: 'dashboard',
  BPMN: 'bpmn',
  BPMN_ADMIN_PROCESS: 'bpmn-process',
  BPMN_ADMIN_INSTANCE: 'bpmn-instance',
  BPMN_MIGRATION: 'bpmn-migration',
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
  DMN_EDITOR: 'dmn-editor',
  DEV_TOOLS: 'dev-tools',
  ORGSTRUCTURE: 'orgstructure'
};

export const AppEditions = {
  COMMUNITY: 'community',
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
  VIEW_MODE: 'viewMode'
};

export const DocLibUrlParams = {
  FOLDER_ID: 'folderId',
  SEARCH: 'dlSearch'
};

export const KanbanUrlParams = {
  BOARD_ID: 'boardId',
  TEMPLATE_ID: JournalUrlParams.JOURNAL_SETTING_ID,
  SEARCH: 'kbSearch'
};

export const SYSTEM_LIST = 'global-system';

export const SystemJournals = {
  JOURNALS: 'ecos-journals',
  TYPES: 'ecos-types',
  KANBAN: 'ecos-boards',
  MENUS: 'ecos-menus',
  FORMS: 'ecos-forms',
  PROCESS: 'bpmn-process-latest',
  WORKSPACES: 'workspaces-journal',
  PROCESS_ELMS: 'bpmn-process-elements'
};

export const COMMENT_TYPE = 'ecos-comment';

export const DateFormats = {
  DATE: 'DD.MM.YYYY',
  DATETIME: 'DD.MM.YYYY HH:mm',
  TIME: 'HH:mm'
};

export const IGNORED_EVENT_ATTRIBUTE = '_isIgnoredEvent';

export const DEFAULT_ORGSTRUCTURE_SEARCH_FIELDS = ['id', '_name'];
export const allowedModes = ['development', 'dev-stage'];

window.Citeck = window.Citeck || {};
window.Citeck.constants = window.Citeck.constants || {};
window.Citeck.constants = { ...window.Citeck.constants, URL, SourcesId };

export const _LOCALHOST_ = 'http://localhost:3000';
