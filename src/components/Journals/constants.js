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
  TABLE: 'table',
  PREVIEW: 'table-preview',
  DOC_LIB: 'document-library'
};

export const isTable = vm => vm === JOURNAL_VIEW_MODE.TABLE;
export const isPreview = vm => vm === JOURNAL_VIEW_MODE.PREVIEW;
export const isDocLib = vm => vm === JOURNAL_VIEW_MODE.DOC_LIB;
export const isTableOrPreview = vm => isTable(vm) || isPreview(vm);

export const JOURNAL_DASHLET_CONFIG_VERSION = 'v2';

export const COMPLEX_FILTER_LIMIT = 1;
