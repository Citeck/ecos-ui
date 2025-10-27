import { createAction } from 'redux-actions';

import { IJournalsApi } from '@/api/journals';
import { JournalColumnType, JournalCreateVariantType } from '@/api/journals/types';
import { WidgetsConfigType } from '@/components/Journals/JournalsPreviewWidgets/JournalsPreviewWidgets';
import { PredicateType } from '@/types/predicates';
import { WrapArgsType } from '@/types/store';
import {
  ColumnsSetupType,
  DataGridType,
  FooterValuesType,
  GroupingJournalType,
  IInitJournalProps,
  IJournalState,
  JournalDashletConfigVersionType,
  JournalSettingsItemType,
  JournalSettingType,
  ViewModeType
} from '@/types/store/journals';

const prefix = 'journals/';

export const setLoading = createAction<WrapArgsType<IJournalState['loading']>>(prefix + 'SET_LOADING');
export const setLoadingGrid = createAction<WrapArgsType<IJournalState['loadingGrid']>>(prefix + 'SET_LOADING_GRID');
export const setForceUpdate = createAction<WrapArgsType<IJournalState['forceUpdate']>>(prefix + 'SET_FORCE_UPDATE');

export const getDashletConfig = createAction<WrapArgsType<string>>(prefix + 'GET_DASHLET_CONFIG');
export const setDashletConfig = createAction<WrapArgsType<IJournalState['config']>>(prefix + 'SET_DASHLET_CONFIG');
export const setDashletConfigByParams = createAction<
  WrapArgsType<{ config: NonNullable<IJournalState['config']>; id?: string; lsJournalId?: string; recordRef?: string }>
>(prefix + 'SET_DASHLET_CONFIG_BY_PARAMS');
export const saveDashlet = createAction<WrapArgsType<{ id: string; config: IJournalState['config'] }>>(prefix + 'SAVE_DASHLET');
export const getDashletEditorData = createAction<WrapArgsType<JournalDashletConfigVersionType>>(prefix + 'GET_DASHLET_EDITOR_DATA');
export const setEditorMode = createAction<WrapArgsType<IJournalState['editorMode']>>(prefix + 'SET_EDITOR_MODE');
export const initJournal = createAction<WrapArgsType<IInitJournalProps>>(prefix + 'INIT_JOURNAL');

export const setSelectedJournals = createAction<WrapArgsType<IJournalState['selectedJournals']>>(prefix + 'SET_SELECTED_JOURNALS');

export const reloadJournalConfig = createAction<
  WrapArgsType<{
    journalId: string;
    force?: boolean;
    callback?: (createVariants?: JournalCreateVariantType[]) => void;
    w?: WrapArgsType<any>;
  }>
>(prefix + 'RELOAD_JOURNAL_CONFIG');

export const setJournalConfig = createAction<WrapArgsType<IJournalState['journalConfig']>>(prefix + 'SET_JOURNAL_CONFIG');
export const checkConfig = createAction<WrapArgsType<IJournalState['config']>>(prefix + 'CHECK_JOURNAL_CONFIG');
export const setCheckLoading = createAction<WrapArgsType<IJournalState['isCheckLoading']>>(prefix + 'SET_CHECK_JOURNAL_LOADING');
export const setJournalExistStatus = createAction<WrapArgsType<IJournalState['isExistJournal']>>(prefix + 'SET_JOURNAL_EXIST_STATUS');
export const setGrid = createAction<WrapArgsType<Partial<IJournalState['grid']>>>(prefix + 'SET_GRID');
export const reloadGrid = createAction<WrapArgsType<Partial<IJournalState['grid']>>>(prefix + 'RELOAD_GRID');

export const execRecordsAction = createAction<
  WrapArgsType<{ records: unknown[]; action: { executeCallback?: () => void }; context: unknown }>
>(prefix + 'EXEC_RECORDS_ACTION');
export const execRecordsActionComplete = createAction<WrapArgsType<{ records: unknown[]; action?: unknown; context?: unknown }>>(
  prefix + 'EXEC_RECORDS_ACTION_COMPLETE'
);
export const saveRecords = createAction<WrapArgsType<Parameters<IJournalsApi['saveRecords']>[0]>>(prefix + 'SAVE_RECORDS');
export const setSelectedRecords = createAction<WrapArgsType<IJournalState['selectedRecords']>>(prefix + 'SET_SELECTED_RECORDS');
export const setExcludedRecords = createAction<WrapArgsType<IJournalState['excludedRecords']>>(prefix + 'SET_EXCLUDED_RECORDS');
export const setSelectAllPageRecords = createAction<WrapArgsType<IJournalState['selectAllPageRecords']>>(
  prefix + 'SET_SELECT_ALL_PAGE_RECORDS'
);
export const setSelectAllRecordsVisible = createAction<WrapArgsType<IJournalState['selectAllRecordsVisible']>>(
  prefix + 'SET_SELECT_ALL_RECORDS_VISIBLE'
);
export const deselectAllRecords = createAction<WrapArgsType<void> | { stateId: string }>(prefix + 'DESELECT_ALL_RECORDS');

export const getJournalsData = createAction<WrapArgsType<Partial<IInitJournalProps>>>(prefix + 'GET_JOURNALS_DATA');
export const saveJournalSetting = createAction<
  WrapArgsType<{ id: string; settings: Partial<JournalSettingsItemType>; callback?: (flag?: boolean) => void }>
>(prefix + 'SAVE_JOURNAL_SETTING');
export const createJournalSetting = createAction<
  WrapArgsType<{ journalId: string; settings: Partial<JournalSettingsItemType>; callback?: (actionResult?: NonNullable<unknown>) => void }>
>(prefix + 'CREATE_JOURNAL_SETTING');
export const deleteJournalSetting = createAction<WrapArgsType<string>>(prefix + 'DELETE_JOURNAL_SETTING');
export const editJournalSetting = createAction<WrapArgsType<string>>(prefix + 'EDIT_JOURNAL_SETTING');
export const setJournalSetting = createAction<WrapArgsType<Partial<JournalSettingType>>>(prefix + 'SET_JOURNAL_SETTING');
export const setJournalSettings = createAction<WrapArgsType<JournalSettingsItemType[]>>(prefix + 'SET_JOURNAL_SETTINGS');
export const setJournalExpandableProp = createAction<WrapArgsType<boolean>>(prefix + 'SET_JOURNAL_EXPANDABLE_PROP');
export const applyJournalSetting = createAction<
  WrapArgsType<{
    settings: Required<Pick<JournalSettingType, 'predicate' | 'sortBy' | 'grouping' | 'columns'>> &
      Partial<Omit<JournalSettingType, 'predicate' | 'sortBy' | 'grouping' | 'columns'>>;
  }>
>(prefix + 'APPLY_JOURNAL_SETTING');
export const resetFiltering = createAction<WrapArgsType<void>>(prefix + 'RESET_JOURNAL_FILTERING');
export const execJournalAction = createAction<WrapArgsType<{ records: unknown[]; action: unknown; context: unknown }>>(
  prefix + 'EXEC_JOURNAL_ACTION'
);

export const setPredicate = createAction<WrapArgsType<PredicateType>>(prefix + 'SET_PREDICATE');
export const setOriginGridSettings = createAction<WrapArgsType<IJournalState['originGridSettings']>>(prefix + 'SET_ORIGIN_GRID_SETTINGS');
export const setColumnsSetup = createAction<WrapArgsType<ColumnsSetupType>>(prefix + 'SET_COLUMNS_SETUP');
export const setGrouping = createAction<WrapArgsType<GroupingJournalType>>(prefix + 'SET_GROUPING');
export const initJournalSettingData = createAction<
  WrapArgsType<{ journalSetting: Partial<IJournalState['journalSetting']>; predicate?: PredicateType }>
>(prefix + 'INIT_JOURNAL_SETTING_DATA');

export const selectJournal = createAction<WrapArgsType<string>>(prefix + 'SELECT_JOURNAL');
export const selectPreset = createAction<WrapArgsType<string>>(prefix + 'SELECT_PRESET');
export const openSelectedPreset = createAction<WrapArgsType<string>>(prefix + 'OPEN_SELECTED_PRESET');

export const toggleViewMode = createAction<WrapArgsType<{ stateId: string; viewMode: ViewModeType }>>(prefix + 'TOGGLE_VIEW_MODE');
export const goToJournalsPage = createAction<WrapArgsType<DataGridType>>(prefix + 'GO_TO_JOURNALS_PAGE');
export const runSearch = createAction<{ stateId: string; text: string }>(prefix + 'RUN_SEARCH');
export const setSearching = createAction<WrapArgsType<IJournalState['searching']>>(prefix + 'SET_SEARCHING');
export const setUrl = createAction<WrapArgsType<IJournalState['url']>>(prefix + 'SET_URL');
export const initState = createAction<{ stateId: string }>(prefix + 'INIT_STATE');
export const resetState = createAction<string>(prefix + 'RESET_STATE');
export const setRecordRef = createAction<WrapArgsType<string>>(prefix + 'SET_RECORD_REF');

export const setSearchText = createAction<{ stateId: string; text: string }>(prefix + 'SET_SEARCH_TEXT');

export const saveColumn = createAction<WrapArgsType<JournalColumnType>>(prefix + 'SAVE_COLUMN');

export const setFooterValue = createAction<WrapArgsType<FooterValuesType>>(prefix + 'SET_FOOTER_VALUE');

export const getJournalWidgetsConfig = createAction<WrapArgsType<string>>(prefix + 'GET_JOURNAL_CONFIG_WIDGETS');
export const setJournalWidgetsConfig = createAction<WrapArgsType<WidgetsConfigType>>(prefix + 'SET_JOURNAL_CONFIG_WIDGETS');
export const updateJournalWidgetsConfig = createAction<WrapArgsType<Partial<WidgetsConfigType> | undefined>>(
  prefix + 'UPDATE_JOURNAL_CONFIG_WIDGETS'
);

export const getNextPage = createAction<WrapArgsType<{ searchPredicate?: PredicateType }>>(prefix + 'GET_NEXT_PAGE');

export const fetchBreadcrumbs = createAction<WrapArgsType<void>>(prefix + 'FETCH_BREADCRUMBS');
export const setBreadcrumbs = createAction<WrapArgsType<IJournalState['breadcrumbs']>>(prefix + 'SET_BREADCRUMBS');

export const cancelReloadGrid = createAction<void>(prefix + 'CANCEL_RELOAD_GRID');
export const cancelLoadGrid = createAction<void>(prefix + 'CANCEL_LOAD_GRID');
export const cancelInitJournal = createAction<void>(prefix + 'CANCEL_INIT_JOURNAL');
export const cancelGoToPageJournal = createAction<void>(prefix + 'CANCEL_GO_TO_PAGE_JOURNAL');
