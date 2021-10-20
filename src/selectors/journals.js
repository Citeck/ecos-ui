import { createSelector } from 'reselect';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';

import { defaultState, emptyJournalConfig } from '../reducers/journals';
import { DEFAULT_JOURNALS_PAGINATION, JOURNAL_DASHLET_CONFIG_VERSION } from '../components/Journals/constants';
import JournalsConverter from '../dto/journals';
import { ParserPredicate } from '../components/Filters/predicates';
import { getId } from '../helpers/util';

const selectState = (state, key) => get(state, ['journals', key], { ...defaultState }) || {};

export const selectJournalSettings = createSelector(
  selectState,
  ownState => get(ownState, 'journalSetting', defaultState.journalSetting)
);

export const selectJournals = createSelector(
  selectState,
  ownState => get(ownState, 'journals', [])
);

export const selectJournalUiType = createSelector(
  (journals, id) => journals.find(journal => journal.nodeRef === id),
  journal => get(journal, 'uiType')
);

export const selectUrl = (state, id) => get(state, ['journals', id, 'url']) || {};

export const selectJournalData = selectState;

export const selectNewVersionDashletConfig = createSelector(
  selectState,
  ownProps => get(ownProps, ['config', JOURNAL_DASHLET_CONFIG_VERSION], null)
);

export const selectDashletConfig = createSelector(
  selectState,
  ownProps => get(ownProps, 'config', null)
);

export const selectJournalConfig = createSelector(
  selectState,
  ownProps => get(ownProps, 'journalConfig', null)
);

export const selectIsNotExistsJournal = createSelector(
  selectState,
  ownProps => {
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
  }
);

export const selectColumnsSetup = createSelector(
  selectState,
  ownProps => get(ownProps, 'columnsSetup', {})
);

export const selectGrouping = createSelector(
  selectState,
  ownProps => get(ownProps, 'grouping', {})
);

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

export const selectViewColumns = createSelector(
  selectState,
  ownProps => {
    const columns = get(ownProps, 'grid.columns') || [];
    return columns.filter(col => col.default);
  }
);

export const selectDashletConfigJournalId = createSelector(
  selectNewVersionDashletConfig,
  props => {
    if (!props) {
      return null;
    }

    return !props.customJournalMode || !props.customJournal ? props.journalId : props.customJournal;
  }
);

export const selectFilterGroup = createSelector(
  (predicate, columns) => ({ predicate, columns }),
  ({ predicate, columns }) => {
    return ParserPredicate.parse(predicate, columns);
  }
);

export const selectSettingsData = createSelector(
  selectState,
  ownProps => {
    return cloneDeep({
      journalSetting: ownProps.journalSetting,
      columnsSetup: ownProps.columnsSetup,
      grouping: ownProps.grouping,
      originGridSettings: ownProps.originGridSettings
    });
  }
);

export const selectSettingsFilters = createSelector(
  selectState,
  ownProps => {
    return cloneDeep({
      predicate: get(ownProps, 'journalSetting.predicate'),
      columns: get(ownProps, 'journalConfig.columns', []).filter(c => c.visible),
      metaRecord: get(ownProps, 'journalConfig.meta.metaRecord')
    });
  }
);

export const selectSettingsColumns = createSelector(
  selectState,
  ownProps => {
    return cloneDeep({
      columns: get(ownProps, 'columnsSetup.columns', []).map(item => ({
        id: getId(),
        ...item
      })),
      sortBy: get(ownProps, 'columnsSetup.sortBy')
    });
  }
);

export const selectSettingsGrouping = createSelector(
  selectState,
  ownProps => {
    return cloneDeep({
      columns: get(ownProps, 'grouping.columns'),
      groupBy: get(ownProps, 'grouping.groupBy')
    });
  }
);

export const selectGridPaginationMaxItems = createSelector(
  selectState,
  ownProps => {
    return get(ownProps, 'grid.pagination.maxItems', DEFAULT_JOURNALS_PAGINATION.maxItems);
  }
);
