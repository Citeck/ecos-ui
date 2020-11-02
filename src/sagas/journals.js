import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';

import Records from '../components/Records';

import {
  createJournalSetting,
  deleteJournalSetting,
  execRecordsAction,
  getDashletConfig,
  getDashletEditorData,
  getJournalsData,
  goToJournalsPage,
  initJournal,
  initJournalSettingData,
  initPreview,
  onJournalSelect,
  onJournalSettingsSelect,
  reloadGrid,
  reloadTreeGrid,
  renameJournalSetting,
  resetJournalSettingData,
  restoreJournalSettingData,
  saveDashlet,
  saveJournalSetting,
  saveRecords,
  search,
  setColumnsSetup,
  setDashletConfig,
  setDashletConfigByParams,
  setEditorMode,
  setGrid,
  setGridInlineToolSettings,
  setGrouping,
  setJournalConfig,
  setJournals,
  setJournalSetting,
  setJournalSettings,
  setJournalsList,
  setPredicate,
  setPreviewFileName,
  setPreviewUrl,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setSelectedRecords
} from '../actions/journals';
import { setLoading } from '../actions/loader';
import { DEFAULT_INLINE_TOOL_SETTINGS, DEFAULT_JOURNALS_PAGINATION, JOURNAL_SETTING_ID_FIELD } from '../components/Journals/constants';
import { ParserPredicate } from '../components/Filters/predicates';
import { ActionTypes } from '../components/Records/actions';

import {
  decodeLink,
  getFilterUrlParam,
  goToJournalsPage as goToJournalsPageUrl,
  isNewVersionPage,
  removeUrlSearchParams
} from '../helpers/urls';
import { t } from '../helpers/util';
import { wrapSaga } from '../helpers/redux';
import PageService from '../services/PageService';
import { getJournalUIType, getOldPageUrl } from '../api/export/journalsApi';
import { selectJournals, selectJournalSettings, selectJournalUiType } from '../selectors/journals';
import { selectSearch } from '../selectors/router';

const getDefaultSortBy = config => {
  const params = config.params || {};
  // eslint-disable-next-line
  const defaultSortBy = params.defaultSortBy ? eval('(' + params.defaultSortBy + ')') : [];

  return defaultSortBy.map(item => ({
    attribute: item.id,
    ascending: item.order !== 'desc'
  }));
};

function getDefaultJournalSetting(journalConfig) {
  const {
    meta: { groupBy, title },
    columns
  } = journalConfig;

  return {
    title: title,
    sortBy: getDefaultSortBy(journalConfig).map(sort => ({ ...sort })),
    groupBy: groupBy ? Array.from(groupBy) : [],
    columns: columns.map(col => ({ ...col })),
    predicate: ParserPredicate.getDefaultPredicates(journalConfig.columns)
  };
}

function getGridParams({ journalConfig, journalSetting, pagination }) {
  const {
    meta: { createVariants, predicate, actions: journalActions, groupActions },
    sourceId,
    id: journalId
  } = journalConfig;
  const { sortBy, groupBy, columns, predicate: journalSettingPredicate } = journalSetting;
  const predicates = isArray(journalSettingPredicate)
    ? journalSettingPredicate
    : isEmpty(journalSettingPredicate)
    ? []
    : [journalSettingPredicate];

  return {
    groupActions: groupActions || [],
    journalId,
    journalActions,
    createVariants,
    predicate,
    sourceId,
    sortBy: sortBy.map(sort => ({ ...sort })),
    columns: columns.map(col => ({ ...col })),
    groupBy: Array.from(groupBy),
    predicates,
    pagination: { ...pagination }
  };
}

function* sagaGetDashletEditorData({ api, logger, stateId, w }, action) {
  try {
    const config = action.payload || {};
    yield getJournalsList(api, w);
    yield getJournals(api, config.journalsListId, w);
    yield getJournalSettings(api, config.journalType, w);
  } catch (e) {
    logger.error('[journals sagaGetDashletEditorData saga error', e.message);
  }
}

function* sagaGetDashletConfig({ api, logger, stateId, w }, action) {
  try {
    const config = yield call(api.journals.getDashletConfig, action.payload);

    if (config) {
      const { journalsListId, journalId, journalSettingId = '', customJournal, customJournalMode } = config;

      yield put(setEditorMode(w(false)));
      yield put(setDashletConfig(w(config)));
      yield getJournals(api, journalsListId, w);
      yield put(initJournal(w({ journalId, journalSettingId, customJournal, customJournalMode })));
    } else {
      yield put(setEditorMode(w(true)));
    }
  } catch (e) {
    logger.error('[journals sagaGetDashletConfig saga error', e.message);
  }
}

function* sagaSetDashletConfigFromParams({ api, logger, stateId, w }, action) {
  try {
    const config = action.payload.config || {};
    const recordRef = action.payload.recordRef;
    const { journalsListId, journalId, journalSettingId = '', customJournal, customJournalMode } = config;

    if (journalsListId) {
      yield put(setEditorMode(w(false)));
      yield put(setDashletConfig(w(config)));
      yield getJournals(api, journalsListId, w);
      if (customJournalMode && customJournal) {
        let resolvedCustomJournal = yield _resolveTemplate(recordRef, customJournal);
        yield put(initJournal(w({ journalId: resolvedCustomJournal })));
      } else {
        yield put(initJournal(w({ journalId, journalSettingId })));
      }
    } else {
      yield put(setEditorMode(w(true)));
    }
  } catch (e) {
    logger.error('[journals sagaSetDashletConfigFromParams saga error', e.message);
  }
}

function* _resolveTemplate(recordRef, template) {
  if (!recordRef || template.indexOf('$') === -1) {
    return template;
  }
  let keyExp = /\${(.+?)}/g;
  let attributesMap = {};

  let it = keyExp.exec(template);
  while (it) {
    attributesMap[it[1]] = true;
    it = keyExp.exec(template);
  }
  let attributes = Object.keys(attributesMap);

  if (!attributes.length) {
    return template;
  }

  let attsValues = yield Records.get(recordRef).load(attributes);
  for (let att in attsValues) {
    if (attsValues.hasOwnProperty(att)) {
      let value = attsValues[att] || '';
      template = template.split('${' + att + '}').join(value);
    }
  }

  return template;
}

function* sagaGetJournalsData({ api, logger, stateId, w }) {
  try {
    const url = yield select(state => state.journals[stateId].url);
    const { journalsListId, journalId, journalSettingId = '', userConfigId } = url;

    yield put(setGrid(w({ pagination: DEFAULT_JOURNALS_PAGINATION })));
    yield getJournals(api, journalsListId, w);
    yield put(initJournal(w({ journalId, journalSettingId, userConfigId })));
  } catch (e) {
    logger.error('[journals sagaGetJournalsData saga error', e.message);
  }
}

function* getJournalsList(api, w) {
  const journalsList = yield call(api.journals.getJournalsList);

  yield put(setJournalsList(w(journalsList)));

  return journalsList;
}

function* getJournals(api, journalsListId, w) {
  const journals = journalsListId
    ? yield call(api.journals.getJournalsByJournalsList, journalsListId)
    : yield call(api.journals.getJournals);

  yield Promise.all(
    journals.map(async journal => {
      const uiType = await getJournalUIType(journal.type);

      return (journal.uiType = uiType);
    })
  );

  yield put(setJournals(w(journals)));
}

function* getJournalSettings(api, journalId, w) {
  const settings = yield call(api.journals.getJournalSettings, journalId);

  yield put(setJournalSettings(w(settings)));
}

function* getJournalConfig(api, journalId, w) {
  const journalConfig = yield call(api.journals.getJournalConfig, journalId);

  journalConfig.columns = journalConfig.columns.map(c => ({ ...c, text: t(c.text) }));
  yield put(setJournalConfig(w(journalConfig)));

  return journalConfig;
}

function* getJournalSetting(api, { journalSettingId, journalConfig, userConfig, stateId }, w) {
  let journalSetting;

  if (userConfig) {
    journalSetting = userConfig;
  } else {
    journalSettingId = journalSettingId || journalConfig.journalSettingId || api.journals.getLsJournalSettingId(journalConfig.id) || '';

    if (journalSettingId) {
      journalSetting = yield call(api.journals.getJournalSetting, journalSettingId);
    }

    if (!journalSetting) {
      const url = removeUrlSearchParams(window.location.href, 'journalSettingId');

      window.history.pushState({ path: url }, '', url);

      journalSetting = getDefaultJournalSetting(journalConfig);
    }
  }

  journalSetting = { ...journalSetting, [JOURNAL_SETTING_ID_FIELD]: journalSettingId };

  journalSetting.columns = journalSetting.columns.map(column => {
    const match = journalConfig.columns.filter(c => c.attribute === column.attribute)[0];
    return match ? { ...column, sortable: match.sortable } : column;
  });

  const predicate = journalSetting.predicate;

  yield put(setJournalSetting(w(journalSetting)));
  yield put(initJournalSettingData(w({ journalSetting, predicate })));

  return journalSetting;
}

function* sagaInitJournalSettingData({ api, logger, stateId, w }, action) {
  try {
    const { journalSetting, predicate } = action.payload;
    const journalConfig = yield select(state => state.journals[stateId].journalConfig);

    yield put(setPredicate(w(predicate || journalSetting.predicate)));

    yield put(
      setColumnsSetup(
        w({
          columns: (journalSetting.groupBy.length ? journalConfig.columns : journalSetting.columns).map(c => ({ ...c })),
          sortBy: journalSetting.sortBy.map(s => ({ ...s }))
        })
      )
    );

    yield put(
      setGrouping(
        w({
          columns: (journalSetting.groupBy.length ? journalSetting.columns : []).map(c => ({ ...c })),
          groupBy: journalSetting.groupBy.map(g => ({ ...g }))
        })
      )
    );
  } catch (e) {
    logger.error('[journals sagaInitJournalSettingData saga error', e.message);
  }
}

function* sagaResetJournalSettingData({ api, logger, stateId, w }, action) {
  try {
    const journalSettingId = action.payload;
    const journalConfig = yield select(state => state.journals[stateId].journalConfig);

    yield getJournalSetting(api, { journalSettingId, journalConfig, stateId }, w);
  } catch (e) {
    logger.error('[journals sagaResetJournalSettingData saga error', e.message);
  }
}

function* sagaRestoreJournalSettingData({ api, logger, stateId, w }, action) {
  try {
    const journalSetting = action.payload;

    yield put(setJournalSetting(w(journalSetting)));
    yield put(initJournalSettingData(w({ journalSetting })));
  } catch (e) {
    logger.error('[journals sagaResetJournalSettingData saga error', e.message);
  }
}

function* getGridData(api, params, stateId) {
  const { pagination: _pagination, predicates: _predicates, ...forRequest } = params;
  const _recordRef = yield select(state => state.journals[stateId].recordRef);
  const config = yield select(state => state.journals[stateId].config);
  const groupBy = get(forRequest, 'groupBy', []);
  const predicates = ParserPredicate.removeEmptyPredicates(cloneDeep(_predicates));
  const pagination = groupBy.length ? { ..._pagination, maxItems: undefined } : _pagination;
  const recordRef = _recordRef && (config || {}).onlyLinked ? _recordRef : null;
  const groupActions = get(forRequest, 'groupActions', []);

  return yield call(api.journals.getGridData, { ...forRequest, predicates, pagination, recordRef, groupActions });
}

function* loadGrid(api, { journalSettingId, journalConfig, userConfigId, stateId }, w) {
  const userConfig = userConfigId ? yield call(api.userConfig.getConfig, { id: userConfigId }) : null;
  const pagination = userConfig ? userConfig.pagination : yield select(state => state.journals[stateId].grid.pagination);
  const journalSetting = yield getJournalSetting(api, { journalSettingId, journalConfig, userConfig, stateId }, w);
  const params = getGridParams({ journalConfig, journalSetting, pagination });
  const searchPredicate = yield getSearchPredicate({ stateId });
  const gridData = yield getGridData(api, { ...params, searchPredicate }, stateId);
  const editingRules = yield getGridEditingRules(api, gridData);
  let selectedRecords = [];
  let isSelectAllRecords = false;

  if (!!userConfigId) {
    if (isEmpty(userConfig.selectedItems)) {
      selectedRecords = get(gridData, 'data', []).map(item => item.id);
      isSelectAllRecords = true;
    } else {
      selectedRecords = userConfig.selectedItems;
    }
  }

  yield put(setSelectedRecords(w(selectedRecords)));
  yield put(setSelectAllRecords(w(isSelectAllRecords)));
  yield put(setSelectAllRecordsVisible(w(false)));
  yield put(setGridInlineToolSettings(w(DEFAULT_INLINE_TOOL_SETTINGS)));
  yield put(setPreviewUrl(w('')));
  yield put(setPreviewFileName(w('')));

  yield put(setGrid(w({ ...params, ...gridData, editingRules })));
}

function* getGridEditingRules(api, gridData) {
  const { data = [], columns = [] } = gridData;
  let editingRules = yield data.map(function*(row) {
    const canEditing = yield call(api.journals.checkRowEditRules, row.id);
    let byColumns = false;

    if (canEditing) {
      byColumns = yield columns.map(function*(column) {
        const isProtected = yield call(api.journals.checkCellProtectedFromEditing, row.id, column.dataField);

        return {
          [column.dataField]: !isProtected
        };
      });

      byColumns = byColumns.reduce(
        (current, result) => ({
          ...result,
          ...current
        }),
        {}
      );
    }

    return {
      [row.id]: byColumns
    };
  });

  editingRules = editingRules.reduce(
    (current, result) => ({
      ...result,
      ...current
    }),
    {}
  );

  return editingRules;
}

function* sagaReloadGrid({ api, logger, stateId, w }, action) {
  try {
    yield put(setLoading(w(true)));

    const journalSetting = yield select(state => selectJournalSettings(state, stateId));
    const grid = yield select(state => state.journals[stateId].grid);
    const searchPredicate = yield getSearchPredicate({ logger, stateId });

    grid.columns = get(journalSetting, 'columns', []);

    const params = { ...grid, ...(action.payload || {}), searchPredicate };
    const gridData = yield getGridData(api, params, stateId);
    const editingRules = yield getGridEditingRules(api, gridData);
    const selectAllRecords = yield select(state => state.journals[stateId].selectAllRecords);
    let selectedRecords = [];

    if (!!selectAllRecords) {
      selectedRecords = get(gridData, 'data', []).map(item => item.id);
    }

    yield put(setSelectedRecords(w(selectedRecords)));
    yield put(setGrid(w({ ...params, ...gridData, editingRules })));
    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[journals sagaReloadGrid saga error', e.message);
  }
}

function* sagaReloadTreeGrid({ api, logger, stateId, w }) {
  try {
    yield put(setLoading(w(true)));

    const gridData = yield call(api.journals.getTreeGridData);
    const editingRules = yield getGridEditingRules(api, gridData);

    yield put(setGrid(w({ ...gridData, editingRules })));

    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[journals sagaReloadTreeGrid saga error', e.message);
  }
}

function* sagaSaveDashlet({ api, logger, stateId, w }, action) {
  try {
    const { id, config } = action.payload;

    yield call(api.journals.saveDashletConfig, config, id);
    yield put(getDashletConfig(w(id)));
  } catch (e) {
    logger.error('[journals sagaSaveDashlet saga error', e.message);
  }
}

function* sagaInitJournal({ api, logger, stateId, w }, action) {
  try {
    yield put(setLoading(w(true)));

    const { journalId, journalSettingId, userConfigId, customJournal, customJournalMode } = action.payload;

    let journalConfig;
    if (!customJournalMode || !customJournal) {
      journalConfig = yield getJournalConfig(api, journalId, w);
    } else {
      journalConfig = yield getJournalConfig(api, customJournal, w);
    }

    yield getJournalSettings(api, journalConfig.id, w);
    yield loadGrid(api, { journalSettingId, journalConfig, userConfigId, stateId }, w);

    yield put(setLoading(w(false)));
  } catch (e) {
    yield put(setLoading(w(false)));
    logger.error('[journals sagaInitJournal saga error', e.message);
  }
}

function* sagaOnJournalSettingsSelect({ api, logger, stateId, w }, action) {
  try {
    yield put(setLoading(w(true)));

    const journalSettingId = action.payload;
    const journalConfig = yield select(state => state.journals[stateId].journalConfig);

    api.journals.setLsJournalSettingId(journalConfig.id, journalSettingId);

    yield loadGrid(api, { journalSettingId, journalConfig, stateId }, w);
    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[journals sagaOnJournalSettingsSelect saga error', e.message);
  }
}

function* sagaOnJournalSelect({ api, logger, stateId, w }, action) {
  try {
    const journalId = action.payload;
    const journals = yield select(state => selectJournals(state, stateId, journalId));
    const uiType = yield select(() => selectJournalUiType(journals, journalId));
    const needLink = isNewVersionPage() ? uiType === 'share' : uiType === 'react';

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-484
    if (needLink) {
      const { journalsListId } = yield select(selectSearch);
      const data = journalsListId.split('-');
      let siteId = '';
      let listId = '';

      if (data[0] === 'site') {
        data.shift();
        listId = data.pop();
        siteId = data.join('-');
      }

      const url = yield call(getOldPageUrl, { journalId, siteId, listId });

      return PageService.changeUrlLink(url, { reopenBrowserTab: true });
    }

    yield put(setLoading(w(true)));

    const journalConfig = yield getJournalConfig(api, journalId, w);

    yield getJournalSettings(api, journalConfig.id, w);
    yield loadGrid(api, { journalConfig, stateId }, w);
    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[journals sagaOnJournalSelect saga error', e.message);
  }
}

function* sagaExecRecordsAction({ api, logger, stateId, w }, action) {
  try {
    const actionResult = yield call(api.recordActions.executeAction, action.payload);
    const check = isArray(actionResult) ? actionResult.some(res => res !== false) : actionResult !== false;

    if (check) {
      if (get(action, 'payload.action.type', '') !== ActionTypes.BACKGROUND_VIEW) {
        yield put(reloadGrid(w()));
      }
    }
  } catch (e) {
    logger.error('[journals sagaExecRecordsAction saga error', e.message, e);
  }
}

function* sagaSaveRecords({ api, logger, stateId, w }, action) {
  try {
    const grid = yield select(state => state.journals[stateId].grid);
    const editingRules = yield getGridEditingRules(api, grid);
    const { id, attributes } = action.payload;
    const attribute = Object.keys(attributes)[0];
    const value = attributes[attribute];
    const tempAttributes = {};
    let formatter;

    yield call(api.journals.saveRecords, { id, attributes });

    grid.columns.forEach(c => {
      tempAttributes[c.attribute] = c.formatExtraData.formatter.getQueryString(c.attribute);

      if (c.attribute === attribute) {
        formatter = c.formatExtraData.formatter;
      }
    });

    const savedRecord = yield call(api.journals.getRecord, { id, attributes: tempAttributes, noCache: true });

    grid.data = grid.data.map(record => {
      if (record.id === id) {
        const savedValue = formatter ? formatter.getId(savedRecord[attribute]) : savedRecord[attribute];

        if (savedValue !== value) {
          savedRecord.error = attribute;
        }

        return { ...savedRecord, id };
      }

      return record;
    });

    yield put(setGrid(w({ ...grid, editingRules })));
  } catch (e) {
    logger.error('[journals sagaSaveRecords saga error', e.message);
  }
}

function* sagaSaveJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const { id: journalSettingId } = action.payload;

    yield call(api.journals.saveJournalSetting, action.payload);

    const journalConfig = yield select(state => state.journals[stateId].journalConfig);

    yield loadGrid(api, { journalSettingId, journalConfig, stateId }, w);
  } catch (e) {
    logger.error('[journals sagaSaveJournalSetting saga error', e.message);
  }
}

function* sagaCreateJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const journalSettingId = yield call(api.journals.createJournalSetting, action.payload);
    const journalConfig = yield select(state => state.journals[stateId].journalConfig);

    yield getJournalSettings(api, journalConfig.id, w);
    yield put(onJournalSettingsSelect(w(journalSettingId)));
  } catch (e) {
    logger.error('[journals sagaCreateJournalSetting saga error', e.message);
  }
}

function* sagaDeleteJournalSetting({ api, logger, stateId, w }, action) {
  try {
    yield call(api.journals.deleteJournalSetting, action.payload);

    const journalConfig = yield select(state => state.journals[stateId].journalConfig);

    yield getJournalSettings(api, journalConfig.id, w);
    yield loadGrid(api, { journalConfig, stateId }, w);
  } catch (e) {
    logger.error('[journals sagaCreateJournalSetting saga error', e.message);
  }
}

function* sagaRenameJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const { id: journalSettingId, title } = action.payload;

    const journalConfig = yield select(state => state.journals[stateId].journalConfig);
    const journalSetting = yield call(api.journals.getJournalSetting, journalSettingId);

    journalSetting.title = title;

    yield call(api.journals.saveJournalSetting, { id: journalSettingId, settings: journalSetting });
    yield getJournalSettings(api, journalConfig.id, w);
  } catch (e) {
    logger.error('[journals sagaRenameJournalSetting saga error', e.message);
  }
}

function* sagaInitPreview({ api, logger, stateId, w }, action) {
  try {
    const nodeRef = action.payload;
    const previewUrl = yield call(api.journals.getPreviewUrl, nodeRef);

    yield put(setPreviewUrl(w(previewUrl)));
  } catch (e) {
    logger.error('[journals sagaInitPreview saga error', e.message);
  }
}

function* sagaGoToJournalsPage({ api, logger, stateId, w }, action) {
  try {
    let row = action.payload;

    const url = yield select(state => state.journals[stateId].url);
    const journalConfig = yield select(state => state.journals[stateId].journalConfig);
    const config = yield select(state => state.journals[stateId].config);
    const grid = yield select(state => state.journals[stateId].grid);

    const { columns, groupBy = [] } = grid;
    const { journalsListId = config.journalsListId, journalSettingId = config.journalSettingId } = url;
    let {
      id = '',
      meta: { nodeRef = '', criteria = [], predicate = {} }
    } = journalConfig;
    let filter = '';

    if (id === 'event-lines-stat') {
      //todo: move to journal config

      let eventRef = row['groupBy_skifem:eventTypeAssoc'];
      let eventTypeId = yield call(api.journals.getRecord, { id: eventRef, attributes: 'skifdm:eventTypeId?str' });
      id = 'event-lines-' + eventTypeId;
    } else {
      const journalType = (criteria[0] || {}).value || predicate.val;

      if (journalType && journalConfig.groupBy && journalConfig.groupBy.length) {
        let journalConfig = yield call(api.journals.getJournalConfig, `alf_${encodeURI(journalType)}`);
        nodeRef = journalConfig.meta.nodeRef;
        id = journalConfig.id;
      }

      if (groupBy.length) {
        for (let key in row) {
          if (!row.hasOwnProperty(key)) {
            continue;
          }

          const value = row[key];

          if (value && value.str) {
            //row[key] = value.str;
          }
        }
      } else {
        let attributes = {};

        columns.forEach(c => (attributes[c.attribute] = `${c.attribute}?str`));

        row = yield call(api.journals.getRecord, { id: row.id, attributes: attributes }) || row;
      }

      filter = getFilterUrlParam({ row, columns, groupBy });
    }

    if (filter) {
      api.journals.setLsJournalSettingId(id, '');
    }

    goToJournalsPageUrl({
      journalsListId,
      journalId: id,
      journalSettingId,
      nodeRef,
      filter
    });
  } catch (e) {
    logger.error('[journals sagaGoToJournalsPage saga error', e.message);
  }
}

function* getSearchPredicate({ logger, stateId }) {
  try {
    const grid = yield select(state => state.journals[stateId].grid);
    const fullSearch = yield select(state => get(state, ['journals', stateId, 'journalConfig', 'params', 'full-search-predicate']));
    const { columns = [], groupBy = [], search } = grid;
    let predicate;

    if (fullSearch) {
      predicate = JSON.parse(fullSearch);
      predicate.val = search;
    } else {
      predicate = ParserPredicate.getSearchPredicates({ text: search, columns, groupBy });
    }

    if (predicate) {
      predicate = [predicate];
    }

    if (isEmpty(search)) {
      predicate = [];
    }

    return predicate;
  } catch (e) {
    logger.error('[journals getSearchPredicate function* error', e.message);
  }
}

function* sagaSearch({ logger, w }) {
  try {
    yield put(reloadGrid(w()));
    PageService.changeUrlLink(decodeLink(window.location.pathname + window.location.search), { updateUrl: true });
  } catch (e) {
    logger.error('[journals sagaSearch saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getDashletConfig().type, wrapSaga, { ...ea, saga: sagaGetDashletConfig });
  yield takeEvery(setDashletConfigByParams().type, wrapSaga, { ...ea, saga: sagaSetDashletConfigFromParams });
  yield takeEvery(getDashletEditorData().type, wrapSaga, { ...ea, saga: sagaGetDashletEditorData });
  yield takeLatest(getJournalsData().type, wrapSaga, { ...ea, saga: sagaGetJournalsData });
  yield takeEvery(saveDashlet().type, wrapSaga, { ...ea, saga: sagaSaveDashlet });
  yield takeEvery(initJournal().type, wrapSaga, { ...ea, saga: sagaInitJournal });

  yield takeEvery(reloadGrid().type, wrapSaga, { ...ea, saga: sagaReloadGrid });
  yield takeEvery(reloadTreeGrid().type, wrapSaga, { ...ea, saga: sagaReloadTreeGrid });

  yield takeEvery(execRecordsAction().type, wrapSaga, { ...ea, saga: sagaExecRecordsAction });
  yield takeEvery(saveRecords().type, wrapSaga, { ...ea, saga: sagaSaveRecords });

  yield takeEvery(saveJournalSetting().type, wrapSaga, { ...ea, saga: sagaSaveJournalSetting });
  yield takeEvery(createJournalSetting().type, wrapSaga, { ...ea, saga: sagaCreateJournalSetting });
  yield takeEvery(deleteJournalSetting().type, wrapSaga, { ...ea, saga: sagaDeleteJournalSetting });
  yield takeEvery(renameJournalSetting().type, wrapSaga, { ...ea, saga: sagaRenameJournalSetting });

  yield takeEvery(onJournalSettingsSelect().type, wrapSaga, { ...ea, saga: sagaOnJournalSettingsSelect });
  yield takeEvery(onJournalSelect().type, wrapSaga, { ...ea, saga: sagaOnJournalSelect });
  yield takeEvery(initJournalSettingData().type, wrapSaga, { ...ea, saga: sagaInitJournalSettingData });
  yield takeEvery(resetJournalSettingData().type, wrapSaga, { ...ea, saga: sagaResetJournalSettingData });
  yield takeEvery(restoreJournalSettingData().type, wrapSaga, { ...ea, saga: sagaRestoreJournalSettingData });

  yield takeEvery(initPreview().type, wrapSaga, { ...ea, saga: sagaInitPreview });
  yield takeEvery(goToJournalsPage().type, wrapSaga, { ...ea, saga: sagaGoToJournalsPage });
  yield takeEvery(search().type, wrapSaga, { ...ea, saga: sagaSearch });
}

export default saga;
