import { createAction } from 'redux-actions';

const prefix = 'docLib/';

export const setIsDocLibEnabled = createAction(prefix + 'SET_IS_ENABLED');
export const setTypeRef = createAction(prefix + 'SET_TYPE_REF');
export const setFileTypeRefs = createAction(prefix + 'SET_FILE_TYPE_REFS');
export const setDirTypeRef = createAction(prefix + 'SET_DIR_TYPE_REF');
export const setCreateVariants = createAction(prefix + 'SET_CREATE_VARIANTS');
export const setRootId = createAction(prefix + 'SET_ROOT_ID');
export const setFolderId = createAction(prefix + 'SET_FOLDER_ID');
export const setFolderTitle = createAction(prefix + 'SET_FOLDER_TITLE');
export const setFolderPath = createAction(prefix + 'SET_FOLDER_PATH');
export const setSearchText = createAction(prefix + 'SET_SEARCH_TEXT');
export const startSearch = createAction(prefix + 'START_SEARCH');
export const createNode = createAction(prefix + 'CREATE_NODE');
export const uploadFiles = createAction(prefix + 'UPLOAD_FILES');

export const initDocLib = createAction(prefix + 'INIT');
export const initSidebar = createAction(prefix + 'INIT_SIDEBAR');
export const setSidebarItems = createAction(prefix + 'SET_SIDEBAR_ITEMS');
export const addSidebarItems = createAction(prefix + 'ADD_SIDEBAR_ITEMS');
export const setSidebarIsReady = createAction(prefix + 'SET_SIDEBAR_IS_READY');
export const setSidebarError = createAction(prefix + 'SET_SIDEBAR_ERROR');

export const unfoldSidebarItem = createAction(prefix + 'UNFOLD_SIDEBAR_ITEM');
export const foldSidebarItem = createAction(prefix + 'FOLD_SIDEBAR_ITEM');
export const updateSidebarItem = createAction(prefix + 'UPDATE_SIDEBAR_ITEM');

export const openFolder = createAction(prefix + 'OPEN_FOLDER');
export const loadFolderData = createAction(prefix + 'LOAD_FOLDER_DATA');
export const loadFilesViewerData = createAction(prefix + 'LOAD_FILES_VIEWER_DATA');

export const setFileViewerIsReady = createAction(prefix + 'SET_FILE_VIEWER_IS_READY');
export const setFileViewerItems = createAction(prefix + 'SET_FILE_VIEWER_ITEMS');
export const setFileViewerError = createAction(prefix + 'SET_FILE_VIEWER_ERROR');
export const setFileViewerPagination = createAction(prefix + 'SET_FILE_VIEWER_PAGINATION');
export const setFileViewerTotal = createAction(prefix + 'SET_FILE_VIEWER_TOTAL');
export const setFileViewerSelected = createAction(prefix + 'SET_FILE_VIEWER_SELECTED');
export const setFileViewerLastClicked = createAction(prefix + 'SET_FILE_VIEWER_LAST_CLICKED');

export const setIsGroupActionsReady = createAction(prefix + 'SET_IS_GROUP_ACTIONS_READY');
export const setGroupActions = createAction(prefix + 'SET_GROUP_ACTIONS');
export const execGroupAction = createAction(prefix + 'EXEC_GROUP_ACTION');
