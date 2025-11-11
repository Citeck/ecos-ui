import { URL } from './';

export const IGNORE_TABS_HANDLER_ATTR_NAME = 'data-external';
export const REMOTE_TITLE_ATTR_NAME = 'data-remote-title';
export const OPEN_IN_BACKGROUND = 'data-open-in-background';

export const PANEL_CLASS_NAME = 'page-tab__panel';

export const SCROLL_STEP = 150;
export const LINK_TAG = 'A';
export const LINK_HREF = 'href';
export const TITLE = {
  HOMEPAGE: 'header.site-menu.home-page',
  NEW_TAB: 'page-tabs.new-tab',
  LOADING: 'page-tabs.loading',
  NO_NAME: 'page-tabs.no-name',
  TIMESHEET: 'page-tabs.timesheet',
  JOURNAL: 'page-tabs.journal',
  KANBAN: 'page-tabs.kanban',
  DOC_LIB: 'page-tabs.doc-lib',
  PREVIEW_LIST: 'page-tabs.preview-list',
  ORGSTRUCTURE: 'page-tabs.orgstructure',
  BPM_ADMIN: 'page-tabs.bpmn-admin',
  BPM: 'page-tabs.bpmn-designer',
  DMN: 'page-tabs.dmn-designer',
  ADMIN_PAGE: 'page-tabs.admin-page',
  TYPE: 'page-tabs.type',
  BOARD: 'page-tabs.board',
  FORM: 'page-tabs.form',
  [URL.HOME]: 'header.site-menu.home-page',
  [URL.JOURNAL]: 'page-tabs.journal',
  [URL.DMN_EDITOR]: 'page-tabs.dmn-editor',
  [URL.BPMN_EDITOR]: 'page-tabs.bpmn-editor',
  [URL.CMMN_EDITOR]: 'page-tabs.cmmn-editor',
  [URL.BPMN_ADMIN]: 'page-tabs.bpmn-admin',
  [URL.BPMN_ADMIN_PROCESS]: 'page-tabs.bpmn-admin-process',
  [URL.BPMN_ADMIN_INSTANCE]: 'page-tabs.bpmn-admin-instance',
  [URL.BPMN_MIGRATION]: 'page-tabs.bpmn-migration',
  [URL.DASHBOARD]: 'header.site-menu.home-page',
  [URL.ORGSTRUCTURE]: 'page-tabs.orgstructure',
  [URL.DEV_TOOLS]: 'page-tabs.dev-tools',
  [URL.TIMESHEET]: 'page-tabs.timesheet',
  [URL.TIMESHEET_SUBORDINATES]: 'page-tabs.timesheet',
  [URL.TIMESHEET_FOR_VERIFICATION]: 'page-tabs.timesheet',
  [URL.TIMESHEET_DELEGATED]: 'page-tabs.timesheet',
  [URL.FORM_COMPONENTS]: 'page-tabs.form-components'
};

export const MIN_CONTEXT_WIDTH = 210;
