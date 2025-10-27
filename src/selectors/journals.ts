import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import { createSelector } from 'reselect';

import FilterPredicate from '../components/Filters/predicates/FilterPredicate';

import { selectIsDocLibEnabled } from './docLib';
import { selectIsKanbanEnabled } from './kanban';
import { selectIsEnabledPreviewList } from './previewList';

import { JournalColumnType } from '@/api/journals/types';
import { ParserPredicate } from '@/components/Filters/predicates';
import { DEFAULT_PAGINATION, isTable, JOURNAL_DASHLET_CONFIG_VERSION } from '@/components/Journals/constants';
import { beArray, getId, getTextByLocale } from '@/helpers/util';
import { defaultState } from '@/reducers/journals';
import { PredicateType } from '@/types/predicates';
import { RootState } from '@/types/store';

const selectState = (state: RootState, key: string) => get(state, ['journals', key], { ...defaultState }) || {};

export const selectJournalData = selectState;

export const selectJournalSetting = createSelector(selectState, ownState => get(ownState, 'journalSetting', defaultState.journalSetting));
export const selectJournalSettings = createSelector(selectState, ownState => get(ownState, 'journalSettings', []));

export const selectUrl = createSelector(selectState, ownState => get(ownState, 'url', {}));

export const selectViewMode = createSelector(selectState, ownState => get(ownState, 'viewMode', {}));

export const selectNewVersionDashletConfig = createSelector(selectState, ownProps =>
  get(ownProps, ['config', JOURNAL_DASHLET_CONFIG_VERSION], null)
);

export const selectDashletConfig = createSelector(selectState, ownProps => get(ownProps, 'config', null));
export const selectWidgetsConfig = createSelector(selectState, ownProps => get(ownProps, 'widgetsConfig'));

export const selectJournalPagination = createSelector(selectState, ownProps => get(ownProps, 'grid.pagination', {}));
export const selectJournalTotalCount = createSelector(selectState, ownProps => get(ownProps, 'grid.total', 0));

export const selectJournalConfig = createSelector(selectState, ownProps => get(ownProps, 'journalConfig', null));

export const selectViewColumns = createSelector(selectState, ownProps => (get(ownProps, 'grid.columns') || []).filter(col => col.default));

export const selectDashletConfigJournalId = createSelector(selectNewVersionDashletConfig, props => {
  if (!props) {
    return null;
  }

  return !props.customJournalMode || !props.customJournal ? props.journalId : props.customJournal;
});

export const selectFilterGroup = createSelector(
  (predicate: PredicateType, columns: JournalColumnType[]) => ({ predicate, columns }),
  ({ predicate, columns }) => {
    return ParserPredicate.parse(predicate, columns);
  }
);

export const selectSettingsData = createSelector(selectState, ownProps =>
  cloneDeep({
    journalSetting: ownProps.journalSetting,
    columnsSetup: ownProps.columnsSetup,
    grouping: ownProps.grouping,
    originGridSettings: ownProps.originGridSettings
  })
);

export const selectOriginGridPredicates = createSelector(selectState, ownProps => {
  const predicates = get(ownProps, 'originGridSettings.predicate', {}) || {};

  return (ParserPredicate.getFilters(predicates) || []).map((item: FilterPredicate) => item.predicate);
});

export const selectSettingsFilters = createSelector(selectState, ownProps =>
  cloneDeep({
    predicate: get(ownProps, 'journalSetting.predicate'),
    columns: get(ownProps, 'journalConfig.columns', []).filter(c => c.searchable),
    metaRecord: get(ownProps, 'journalConfig.meta.metaRecord')
  })
);

export const selectSettingsColumns = createSelector(selectState, ownProps =>
  cloneDeep({
    columns: get(ownProps, 'columnsSetup.columns', []).map(item => ({
      id: getId(),
      ...item
    })),
    isExpandedFromGrouped: get(ownProps, 'columnsSetup.isExpandedFromGrouped', false),
    sortBy: get(ownProps, 'columnsSetup.sortBy')
  })
);

export const selectSettingsGrouping = createSelector(selectState, ownProps =>
  cloneDeep({
    needCount: get(ownProps, 'grouping.needCount'),
    columns: get(ownProps, 'grouping.columns'),
    groupBy: get(ownProps, 'grouping.groupBy')
  })
);

export const selectGridPaginationMaxItems = createSelector(selectState, ownProps =>
  get(ownProps, 'grid.pagination.maxItems', DEFAULT_PAGINATION.maxItems)
);

export const selectIsFilterOn = createSelector([selectSettingsFilters, selectSettingsData], (settingsFiltersData, settingsData) => {
  const settingsPredicateFilters = ParserPredicate.getFlatFilters(get(settingsFiltersData, 'predicate', ''));
  const originPredicateFilters = ParserPredicate.getFlatFilters(get(settingsData, 'originGridSettings.predicate', ''));
  const isPreset = get(settingsData, 'journalSetting.id', false);

  if (isPreset) {
    return false;
  }

  return settingsPredicateFilters.length !== originPredicateFilters.length;
});

export const selectWasChangedSettings = createSelector(selectState, ownState =>
  get(ownState, 'wasChangedSettingsOn', []).some(item => isTable(item))
);

export const selectJournalPageProps = createSelector(
  [
    selectState,
    selectJournalSetting,
    selectUrl,
    selectSettingsFilters,
    selectSettingsColumns,
    selectSettingsGrouping,
    selectSettingsData,
    selectIsFilterOn,
    selectWasChangedSettings
  ],
  (
    ownState,
    journalSetting,
    urlParams,
    settingsFiltersData,
    settingsColumnsData,
    settingsGroupingData,
    settingsData,
    isFilterOn,
    wasChangedSettings
  ) => ({
    journalConfig: ownState.journalConfig,
    predicate: ownState.predicate,
    gridPredicates: get(ownState, 'grid.predicates', []),
    grid: ownState.grid,
    selectedRecords: ownState.selectedRecords,
    selectAllPageRecords: ownState.selectAllPageRecords,
    selectAllRecordsVisible: ownState.selectAllRecordsVisible,
    isLoading: ownState.loading,
    forceUpdate: ownState.forceUpdate,
    wasChangedSettings,
    isFilterOn,
    urlParams,
    journalSetting,
    settingsFiltersData,
    settingsColumnsData,
    settingsGroupingData,
    settingsData
  })
);

export const selectKanbanExportGrid = createSelector(selectJournalSetting, settings => ({
  columns: settings.columns,
  predicates: beArray(settings.predicate)
}));

export const selectKanbanJournalProps = createSelector(
  [selectState, selectJournalSetting, selectSettingsFilters, selectSettingsData, selectIsFilterOn, selectKanbanExportGrid],
  (ownState, journalSetting, settingsFiltersData, settingsData, isFilterOn, grid) => ({
    journalConfig: ownState.journalConfig,
    journalSetting,
    settingsFiltersData,
    settingsData,
    isFilterOn,
    grid
  })
);

export const selectCommonJournalPageProps = createSelector(
  [selectState, selectUrl, selectIsDocLibEnabled, selectIsKanbanEnabled, selectIsEnabledPreviewList],
  (ownState, urlParams, isDocLibEnabled, isKanbanEnabled, isPreviewListEnabled) => ({
    isLoadingGrid: ownState.loadingGrid,
    viewMode: ownState.viewMode,
    title: getTextByLocale(get(ownState, 'journalConfig.name')),
    urlParams,
    isDocLibEnabled,
    isKanbanEnabled,
    isPreviewListEnabled
  })
);

export const selectGroupActionsProps = createSelector([selectJournalData, selectIsFilterOn], (ownState, isFilterOn) => ({
  grid: ownState.grid || {},
  isFilterOn: isFilterOn || false,
  columnsSetup: ownState.columnsSetup,
  selectedRecords: ownState.selectedRecords || [],
  excludedRecords: ownState.excludedRecords || [],
  selectAllPageRecords: ownState.selectAllPageRecords,
  selectAllRecordsVisible: ownState.selectAllRecordsVisible
}));
