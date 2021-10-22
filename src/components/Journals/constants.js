export const JOURNAL_SETTING_ID_FIELD = 'fileId';
export const JOURNAL_SETTING_DATA_FIELD = 'data';

export const DEFAULT_PAGINATION = {
  skipCount: 0,
  maxItems: 10,
  page: 1
};

export const DEFAULT_JOURNALS_PAGINATION = {
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
  DOC_LIB: 'document-library'
};

export const Labels = {
  Menu: {
    HIDE_MENU: 'journals.action.hide-menu',
    HIDE_FOLDER_TREE: 'journals.action.hide-folder-tree',
    HIDE_MENU_sm: 'journals.action.hide-menu_sm',
    EMPTY_LIST: 'journals.menu.journal-list.empty'
  },
  Preset: {
    //editor
    FIELD_NAME: 'journal.presets.modal.field.name',
    FIELD_AUTH: 'journal.presets.modal.field.authority',
    BTN_CLOSE: 'journal.presets.modal.btn.cancel',
    BTN_SAVE: 'journal.presets.modal.btn.save',
    //list
    DEFAULT: 'journal.presets.default',
    TEMPLATES_TITLE: 'journal.presets.menu.title',
    TEMPLATE_RENAME: 'journals.action.rename-tpl-msg',
    TEMPLATE_REMOVE: 'journals.action.delete-tpl-msg',
    TEMPLATE_REMOVE_TITLE: 'journals.action.delete-tpl-msg',
    TEMPLATE_REMOVE_TEXT: 'journals.action.remove-tpl-msg'
  }
};

export const JOURNAL_DASHLET_CONFIG_VERSION = 'v2';

export const COMPLEX_FILTER_LIMIT = 1;
