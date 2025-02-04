export const DEFAULT_PAGINATION = {
  skipCount: 0,
  maxItems: 10,
  page: 1
};

export const PAGINATION_SIZES = [{ value: 10, label: 10 }, { value: 30, label: 30 }, { value: 50, label: 50 }, { value: 100, label: 100 }];

export const MIN_CARD_DATA_NEW_JOURNAL = 6;

export const PADDING_NEW_JOURNAL = 10;
export const HEIGHT_GRID_WRAPPER = 15;
export const HEIGHT_GRID_ROW = 28;
export const HEIGHT_THEAD = 35;
export const MAX_HEIGHT_TOTAL_AMOUNT = 40;
export const ECOS_GRID_PADDING_HORIZONTAL = 14;

export const HEIGHT_LIST_VIEW_ITEM = 134;

export const CLASSNAME_JOURNAL_BODY_TOP = 'ecos-journal__body-top';

export const DEFAULT_INLINE_TOOL_SETTINGS = {
  height: 0,
  top: 0,
  left: 0,
  row: {},
  actions: []
};

export const JOURNAL_MIN_HEIGHT = 300;
export const JOURNAL_MIN_HEIGHT_MOB = 450;

export const JOURNAL_VIEW_MODE = {
  TABLE: 'table',
  PREVIEW: 'table-preview',
  DOC_LIB: 'document-library',
  PREVIEW_LIST: 'preview-list',
  KANBAN: 'kanban'
};

export const KANBAN_SELECTOR_MODE = {
  BOARD: 'board',
  TEMPLATES: 'templates'
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
    PREVIEW_LIST: 'journals.view.label.preview-list',
    DOC_LIB: 'journals.view.label.document-library',
    KANBAN: 'journals.view.label.kanban'
  },
  Menu: {
    HIDE_MENU: 'journals.action.hide-menu',
    HIDE_FOLDER_TREE: 'journals.action.hide-folder-tree',
    HIDE_MENU_sm: 'journals.action.hide-menu_sm',
    EMPTY_LIST: 'journals.menu.journal-list.empty',
    SETTINGS_TITLE: 'journals.menu.settings-title'
  },
  Settings: {
    CREATE_PRESET: 'journals.action.create-template',
    APPLY_PRESET: 'journals.action.apply-template',
    RESET: 'journals.action.reset',
    APPLY: 'journals.action.apply'
  },
  Preset: {
    //editor
    FIELD_NAME: 'journal.presets.modal.field.name',
    FIELD_AUTH: 'journal.presets.modal.field.authority',
    FIELD_ALL_AUTH: 'journal.presets.modal.field.authorities',
    BTN_CLOSE: 'journal.presets.modal.btn.cancel',
    BTN_SAVE: 'journal.presets.modal.btn.save',
    //list
    TEMPLATES_TITLE: 'journal.presets.menu.title',
    TEMPLATE_RENAME: 'journal.presets.action.rename',
    TEMPLATE_REMOVE: 'journal.presets.action.delete',
    TEMPLATE_REMOVE_TITLE: 'journal.presets.action.delete',
    TEMPLATE_REMOVE_TEXT: 'journal.presets.action.delete.msg'
  }
};

export const isTable = vm => vm === JOURNAL_VIEW_MODE.TABLE;
export const isPreview = vm => vm === JOURNAL_VIEW_MODE.PREVIEW;
export const isDocLib = vm => vm === JOURNAL_VIEW_MODE.DOC_LIB;
export const isKanban = vm => vm === JOURNAL_VIEW_MODE.KANBAN;
export const isPreviewList = vm => vm === JOURNAL_VIEW_MODE.PREVIEW_LIST;
export const isTableOrPreview = vm => isTable(vm) || isPreview(vm);
export const isUnknownView = vm => !Object.values(JOURNAL_VIEW_MODE).includes(vm);

export const relatedViews = [JOURNAL_VIEW_MODE.TABLE, JOURNAL_VIEW_MODE.KANBAN];

export const JOURNAL_DASHLET_CONFIG_VERSION = 'v2';

export const COMPLEX_FILTER_LIMIT = 1;
