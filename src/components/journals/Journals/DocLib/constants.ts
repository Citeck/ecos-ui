export const DISPLAY_MODES = {
  LIST: 'list',
  GRID: 'grid'
} as const;

export type DisplayMode = (typeof DISPLAY_MODES)[keyof typeof DISPLAY_MODES];

export const LS_DISPLAY_MODE_KEY = 'docLibDisplayMode';

export const DocLibLabels = {
  VIEW_LIST: 'document-library.view.list',
  VIEW_GRID: 'document-library.view.grid',
  FOLDERS_TITLE: 'document-library.folders-panel.title',
  FOLDERS_COLLAPSE: 'document-library.folders-panel.collapse',
  FOLDERS_EXPAND: 'document-library.folders-panel.expand',
  NO_FOLDERS: 'document-library.no-folders',
  EMPTY_FOLDER: 'document-library.empty-folder',
  EMPTY_HINT: 'document-library.empty-folder.hint',
  SEARCH_NO_RESULTS: 'document-library.search.no-results',
  DROP_HERE: 'document-library.drop-files-here',
  SELECTED_COUNT: 'document-library.selection.count',
  CLEAR_SELECTION: 'document-library.selection.clear',
  FETCH_ERROR: 'document-library.failure-to-fetch-data',
  CREATE: 'btn.create.label',
  REFRESH: 'journals.bar.btn.update',
  GROUP_ACTIONS: 'grid.tools.group-actions',
  GROUP_ACTIONS_MOBILE: 'grid.tools.group-actions-mobile',
  CREATE_NODE_TITLE: 'document-library.create-node.title'
};
