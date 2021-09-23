export const JOURNAL_SETTING_ID_FIELD = 'fileId';
export const JOURNAL_SETTING_DATA_FIELD = 'data';

export const DEFAULT_PAGINATION = {
  skipCount: 0,
  maxItems: 10,
  page: 1
};

export const PAGINATION_SIZES = [{ value: 10, label: 10 }, { value: 30, label: 30 }, { value: 50, label: 50 }, { value: 100, label: 100 }];

export const DEFAULT_INLINE_TOOL_SETTINGS = {
  height: 0,
  top: 0,
  left: 0,
  row: {},
  actions: []
};

export const JOURNAL_MIN_HEIGHT = 300;

export const JOURNAL_VIEW_MODE = {
  TABLE: 'table',
  PREVIEW: 'table-preview',
  DOC_LIB: 'document-library',
  KANBAN: 'board'
};

export const Labels = {
  Journal: {
    SHOW_MENU: 'journals.action.show-menu',
    SHOW_MENU_SM: 'journals.action.show-menu_sm'
  },
  DocLib: {
    SHOW_MENU: 'journals.action.show-folder-tree',
    SHOW_MENU_SM: 'journals.action.show-folder-tree_sm'
  },
  Kanban: {
    BAR_TOTAL: 'kanban.label.big-total',
    NO_COLUMNS: 'kanban.label.no-columns',
    COL_NO_CARD: 'kanban.label.no-card',
    COL_NO_MORE_CARDS: 'kanban.label.no-more-cards',
    CARD_NO_TITLE: 'kanban.label.no-name',
    DND_MOVE_HERE: 'kanban.label.dnd.move-here',
    DND_NOT_MOVE_HERE: 'kanban.label.dnd.cant-move-here',
    DND_ALREADY_HERE: 'kanban.label.dnd.already-here',
    BOARD_LIST: 'kanban.label.board-list',
    BTN_SETTINGS: 'kanban.label.btn-settings',
    ERROR_FETCH_DATA: 'kanban.error.get-column-data'
  },
  Views: {
    JOURNAL: 'journals.view.label.journal',
    PREVIEW: 'journals.view.label.journal-preview',
    DOC_LIB: 'journals.view.label.document-library',
    KANBAN: 'journals.view.label.kanban'
  }
};

export const isTable = vm => vm === JOURNAL_VIEW_MODE.TABLE;
export const isPreview = vm => vm === JOURNAL_VIEW_MODE.PREVIEW;
export const isDocLib = vm => vm === JOURNAL_VIEW_MODE.DOC_LIB;
export const isKanban = vm => vm === JOURNAL_VIEW_MODE.KANBAN;
export const isTableOrPreview = vm => isTable(vm) || isPreview(vm);
export const isUnknownView = vm => !Object.values(JOURNAL_VIEW_MODE).includes(vm);

export const relatedViews = [JOURNAL_VIEW_MODE.TABLE, JOURNAL_VIEW_MODE.KANBAN];

export const JOURNAL_DASHLET_CONFIG_VERSION = 'v2';

export const COMPLEX_FILTER_LIMIT = 1;
