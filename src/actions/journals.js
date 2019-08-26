import { createAction } from 'redux-actions';

const prefix = 'journals/';

export const getDashletConfig = createAction(prefix + 'GET_DASHLET_CONFIG');
export const setDashletConfig = createAction(prefix + 'SET_DASHLET_CONFIG');
export const saveDashlet = createAction(prefix + 'SAVE_DASHLET');
export const getDashletEditorData = createAction(prefix + 'GET_DASHLET_EDITOR_DATA');
export const setEditorMode = createAction(prefix + 'SET_EDITOR_MODE');
export const initJournal = createAction(prefix + 'INIT_JOURNAL');

export const setJournalsListItem = createAction(prefix + 'SET_JOURNALS_LIST_ITEM');
export const setJournalsItem = createAction(prefix + 'SET_JOURNALS_ITEM');
export const setSettingItem = createAction(prefix + 'SET_SETTING_ITEM');
export const setJournalsList = createAction(prefix + 'SET_JOURNALS_LIST');
export const setJournals = createAction(prefix + 'SET_JOURNALS');

export const setJournalConfig = createAction(prefix + 'SET_JOURNAL_CONFIG');
export const setGrid = createAction(prefix + 'SET_GRID');
export const reloadGrid = createAction(prefix + 'RELOAD_GRID');
export const reloadTreeGrid = createAction(prefix + 'RELOAD_TREE_GRID');

export const deleteRecords = createAction(prefix + 'DELETE_RECORDS');
export const saveRecords = createAction(prefix + 'SAVE_RECORDS');
export const setSelectedRecords = createAction(prefix + 'SET_SELECTED_RECORDS');
export const setSelectAllRecords = createAction(prefix + 'SET_SELECT_ALL_RECORDS');
export const setSelectAllRecordsVisible = createAction(prefix + 'SET_SELECT_ALL_RECORDS_VISIBLE');
export const setGridInlineToolSettings = createAction(prefix + 'SET_GRID_INLINE_TOOL_SETTINGS');

export const getJournalsData = createAction(prefix + 'GET_JOURNALS_DATA');
export const saveJournalSetting = createAction(prefix + 'SAVE_JOURNAL_SETTING');
export const createJournalSetting = createAction(prefix + 'CREATE_JOURNAL_SETTING');
export const deleteJournalSetting = createAction(prefix + 'DELETE_JOURNAL_SETTING');
export const renameJournalSetting = createAction(prefix + 'RENAME_JOURNAL_SETTING');
export const setJournalSetting = createAction(prefix + 'SET_JOURNAL_SETTING');
export const setJournalSettings = createAction(prefix + 'SET_JOURNAL_SETTINGS');

export const setPredicate = createAction(prefix + 'SET_PREDICATE');
export const setColumnsSetup = createAction(prefix + 'SET_COLUMNS_SETUP');
export const setGrouping = createAction(prefix + 'SET_GROUPING');
export const initJournalSettingData = createAction(prefix + 'INIT_JOURNAL_SETTING_DATA');
export const cancelJournalSettingData = createAction(prefix + 'CANCEL_JOURNAL_SETTING_DATA');

export const onJournalSettingsSelect = createAction(prefix + 'ON_JOURNAL_SETTINGS_SELECT');
export const onJournalSelect = createAction(prefix + 'ON_JOURNAL_SELECT');

export const initPreview = createAction(prefix + 'INIT_PREVIEW');
export const setPreviewUrl = createAction(prefix + 'SET_PREVIEW_URL');
export const setPreviewFileName = createAction(prefix + 'SET_PREVIEW_FILE_NAME');

export const goToJournalsPage = createAction(prefix + 'GO_TO_JOURNALS_PAGE');
export const search = createAction(prefix + 'SEARCH');
export const setUrl = createAction(prefix + 'SET_URL');
export const initState = createAction(prefix + 'INIT_STATE');
export const performGroupAction = createAction(prefix + 'PERFORM_GROUP_ACTION');
export const setPerformGroupActionResponse = createAction(prefix + 'SET_PERFORM_GROUP_ACTION_RESPONSE');
export const createZip = createAction(prefix + 'CREATE_ZIP');
export const setZipNodeRef = createAction(prefix + 'SET_ZIP_NODEREF');
