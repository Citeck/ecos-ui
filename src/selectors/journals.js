import { createSelector } from 'reselect';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';

import { defaultState, emptyJournalConfig } from '../reducers/journals';
import { JOURNAL_DASHLET_CONFIG_VERSION } from '../components/Journals/constants';
import JournalsConverter from '../dto/journals';
import cloneDeep from 'lodash/cloneDeep';

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
