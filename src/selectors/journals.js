import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import { createSelector } from 'reselect';

import { ParserPredicate } from '../components/Filters/predicates';
import { DEFAULT_PAGINATION, isTable, JOURNAL_DASHLET_CONFIG_VERSION } from '../components/Journals/constants';
import JournalsConverter from '../dto/journals';
import { beArray, getId, getTextByLocale } from '../helpers/util';
import { defaultState, emptyJournalConfig } from '../reducers/journals';

import { selectIsDocLibEnabled } from './docLib';
import { selectIsKanbanEnabled } from './kanban';
import { selectIsEnabledPreviewList } from './previewList';

const selectState = (state, key) => get(state, ['journals', key], { ...defaultState }) || {};

export const selectJournalData = selectState;

export const selectJournalSetting = createSelector(selectState, ownState => get(ownState, 'journalSetting', defaultState.journalSetting));
export const selectJournalSettings = createSelector(selectState, ownState => get(ownState, 'journalSettings', []));

export const selectJournals = createSelector(selectState, ownState => get(ownState, 'journals', []));

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

export const selectIsNotExistsJournal = createSelector(selectState, ownProps => {
  const journalConfig = get(ownProps, 'journalConfig');
  const isExistJournal = get(ownProps, 'isExistJournal');

  if (!isExistJournal) {
    return true;
  }

  let isEmptyConfig = isEqual(journalConfig, emptyJournalConfig);

  if (!isEmptyConfig) {
    isEmptyConfig =
      isEmpty(get(journalConfig, 'createVariants')) && isEmpty(get(journalConfig, 'columns')) && isEmpty(get(journalConfig, 'meta'));
  }

  return isEmptyConfig;
});

export const selectColumnsSetup = createSelector(selectState, ownProps => get(ownProps, 'columnsSetup', {}));

export const selectGrouping = createSelector(selectState, ownProps => get(ownProps, 'grouping', {}));

export const selectMergedArrays = createSelector(
  (arrayFrom, arrayTo, compareField) => ({
    arrayFrom: cloneDeep(arrayFrom),
    arrayTo: cloneDeep(arrayTo),
    compareField
  }),
  ({ arrayFrom, arrayTo, compareField }) => JournalsConverter.mergeColumnsSetup(arrayFrom, arrayTo, compareField)
);

export const selectColumnsByGroupable = createSelector(
  (groupBy, columns, compareField = 'dataField') => ({
    groupBy: cloneDeep(groupBy),
    columns: cloneDeep(columns),
    compareField
  }),
  ({ groupBy, columns, compareField }) => {
    const fields = groupBy.reduce((result, current) => {
      result.push(...current.split('&'));

      return [...new Set(result)];
    }, []);

    return columns.map(item => {
      return {
        ...item,
        default: fields.includes(item[compareField])
      };
    });
  }
);

export const selectViewColumns = createSelector(selectState, ownProps => (get(ownProps, 'grid.columns') || []).filter(col => col.default));

export const selectDashletConfigJournalId = createSelector(selectNewVersionDashletConfig, props => {
  if (!props) {
    return null;
  }

  return !props.customJournalMode || !props.customJournal ? props.journalId : props.customJournal;
});

export const selectFilterGroup = createSelector(
  (predicate, columns) => ({ predicate, columns }),
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

  return (ParserPredicate.getFilters(predicates) || []).map(item => item.predicate);
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
