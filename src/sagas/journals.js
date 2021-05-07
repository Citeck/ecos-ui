import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import * as queryString from 'query-string';
import get from 'lodash/get';
import set from 'lodash/set';
import has from 'lodash/has';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';

import { NotificationManager } from 'react-notifications';

import JournalsConverter from '../dto/journals';
import Records from '../components/Records';
import JournalsService from '../components/Journals/service';
import EditorService from '../components/Journals/service/editors/EditorService';
import {
  checkConfig,
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
  openSelectedJournal,
  openSelectedJournalSettings,
  reloadGrid,
  reloadTreeGrid,
  renameJournalSetting,
  resetJournalSettingData,
  restoreJournalSettingData,
  runSearch,
  saveDashlet,
  saveJournalSetting,
  saveRecords,
  setCheckLoading,
  setColumnsSetup,
  setDashletConfig,
  setDashletConfigByParams,
  setEditorMode,
  setGrid,
  setGridInlineToolSettings,
  setGrouping,
  setJournalConfig,
  setJournalExistStatus,
  setJournals,
  setJournalSetting,
  setJournalSettings,
  setLoading,
  setOriginGridSettings,
  setPredicate,
  setPreviewFileName,
  setPreviewUrl,
  setSelectAllRecordsVisible,
  setSelectedJournals,
  setSelectedRecords,
  setUrl
} from '../actions/journals';
import {
  DEFAULT_INLINE_TOOL_SETTINGS,
  DEFAULT_JOURNALS_PAGINATION,
  DEFAULT_PAGINATION,
  JOURNAL_DASHLET_CONFIG_VERSION,
  JOURNAL_SETTING_ID_FIELD
} from '../components/Journals/constants';
import { ParserPredicate } from '../components/Filters/predicates';
import { ActionTypes } from '../components/Records/actions';
import { decodeLink, getFilterParam, getSearchParams, getUrlWithoutOrigin, removeUrlSearchParams } from '../helpers/urls';
import { wrapSaga } from '../helpers/redux';
import PageService from '../services/PageService';
import { selectIsNotExistsJournal, selectJournalData, selectNewVersionDashletConfig, selectUrl } from '../selectors/journals';
import { hasInString, t } from '../helpers/util';
import { COLUMN_DATA_TYPE_DATE, COLUMN_DATA_TYPE_DATETIME } from '../components/Records/predicates/predicates';
import { JournalUrlParams } from '../constants';
import { loadDocumentLibrarySettings } from './docLib';
import { emptyJournalConfig } from '../reducers/journals';

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
  const { groupBy, title } = get(journalConfig, 'meta', {});
  const columns = get(journalConfig, 'columns', []);

  return {
    title,
    sortBy: getDefaultSortBy(journalConfig).map(sort => ({ ...sort })),
    groupBy: groupBy ? Array.from(groupBy) : [],
    columns: columns.map(col => ({ ...col })),
    predicate: ParserPredicate.getDefaultPredicates(columns)
  };
}

function getGridParams({ journalConfig = {}, journalSetting = {}, pagination = DEFAULT_PAGINATION }) {
  const { createVariants, actions: journalActions, groupActions } = get(journalConfig, 'meta', {});
  const { sourceId, id: journalId } = journalConfig;
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

    yield getJournalSettings(api, config.journalType, w);
  } catch (e) {
    logger.error('[journals sagaGetDashletEditorData saga error', e.message);
  }
}

function* sagaGetDashletConfig({ api, logger, stateId, w }, action) {
  try {
    const config = yield call(api.journals.getDashletConfig, action.payload);

    if (config) {
      const { journalsListId, journalId, journalSettingId = '', customJournal, customJournalMode, journalsListIds } = config;

      yield put(setEditorMode(w(isEmpty(journalsListIds))));
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
    const { config = {} } = action.payload;

    if (isEmpty(config) || config.version !== JOURNAL_DASHLET_CONFIG_VERSION) {
      yield put(setEditorMode(w(true)));
      yield put(setLoading(w(false)));
      return;
    }

    const { journalId, journalSettingId = '', customJournal, customJournalMode, journalsListIds } = config[JOURNAL_DASHLET_CONFIG_VERSION];
    const { recordRef } = action.payload;

    if (customJournalMode && customJournal) {
      let resolvedCustomJournal = yield _resolveTemplate(recordRef, customJournal);

      yield put(setEditorMode(w(false)));
      yield put(setDashletConfig(w(config)));
      yield put(initJournal(w({ journalId: resolvedCustomJournal })));
      return;
    }

    const { lsJournalId } = action.payload;
    const journalsListId = get(journalsListIds, '0');
    let selectedJournals = [];

    if (!isEmpty(journalsListIds)) {
      selectedJournals = yield call(api.journals.getJournalsByIds, journalsListIds, { id: 'id', title: '.disp' });
    }

    yield put(setSelectedJournals(w(selectedJournals)));

    if (journalsListId) {
      yield put(setEditorMode(w(isEmpty(journalsListIds))));
      yield put(setDashletConfig(w(config)));
      yield getJournals(api, journalsListId, w);
      if (customJournalMode && customJournal) {
        let resolvedCustomJournal = yield _resolveTemplate(recordRef, customJournal);
        yield put(initJournal(w({ journalId: resolvedCustomJournal })));
      } else {
        yield put(initJournal(w({ journalId: lsJournalId || get(journalsListIds, '0', journalId), journalSettingId })));
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

function* sagaGetJournalsData({ api, logger, stateId, w }, { payload }) {
  try {
    const url = yield select(selectUrl, stateId);
    const { journalsListId, journalId, journalSettingId = '', userConfigId } = url;

    yield put(setGrid(w({ pagination: DEFAULT_JOURNALS_PAGINATION })));
    yield getJournals(api, journalsListId, w);
    yield put(initJournal(w({ journalId, journalSettingId, userConfigId })));
  } catch (e) {
    logger.error('[journals sagaGetJournalsData saga error', e.message);
  }
}

function* getJournals(api, journalsListId, w) {
  const journals = yield call(api.journals.getJournals);

  yield Promise.all(
    journals.map(async journal => {
      const uiType = 'react';
      return (journal.uiType = uiType);
    })
  );

  yield put(setJournals(w(journals)));
}

function* getJournalSettings(api, journalId, w) {
  const settings = yield call(api.journals.getJournalSettings, journalId);

  yield put(setJournalSettings(w(settings)));

  return settings;
}

function* getJournalConfig(api, journalId, w) {
  const journalConfig = yield call([JournalsService, JournalsService.getJournalConfig], journalId);
  yield put(setJournalConfig(w(journalConfig)));
  return journalConfig;
}

function* getColumns({ stateId }) {
  const { journalConfig = {}, journalSetting = {} } = yield select(selectJournalData, stateId);
  const columns = yield JournalsService.resolveColumns(journalSetting.columns);

  if (columns.length) {
    return columns.map(setting => {
      const config = journalConfig.columns.find(column => column.attribute === setting.attribute);
      return config ? { ...config, ...setting, sortable: config.sortable } : setting;
    });
  }

  return columns;
}

function* getJournalSetting(api, { journalSettingId, journalConfig, sharedSettings, stateId }, w) {
  try {
    const { journalSetting: _journalSetting = {} } = yield select(selectJournalData, stateId);
    let journalSetting;

    if (sharedSettings) {
      journalSetting = sharedSettings;
    } else {
      journalSettingId = journalSettingId || journalConfig.journalSettingId;

      if (!journalSettingId) {
        journalSettingId = yield call(api.journals.getLsJournalSettingId, journalConfig.id);
      }

      if (journalSettingId) {
        journalSetting = yield call(api.journals.getJournalSetting, journalSettingId);

        if (get(journalSetting, 'error')) {
          NotificationManager.error(t('journal.error.fail-get-settings-template'));
          journalSetting = null;
        }

        if (!journalSetting) {
          yield call(api.journals.setLsJournalSettingId, journalConfig.id, '');
        }
      }

      if (!journalSetting && hasInString(window.location.href, JournalUrlParams.JOURNAL_SETTING_ID)) {
        const url = removeUrlSearchParams(window.location.href, JournalUrlParams.JOURNAL_SETTING_ID);

        window.history.replaceState({ path: url }, '', url);

        journalSetting = getDefaultJournalSetting(journalConfig);
      }

      if (isEmpty(journalSettingId) && isEmpty(journalSetting)) {
        journalSetting = getDefaultJournalSetting(journalConfig);
      }
    }

    journalSetting = { ..._journalSetting, ...journalSetting, [JOURNAL_SETTING_ID_FIELD]: journalSettingId };
    journalSetting.columns = yield JournalsService.resolveColumns(journalSetting.columns);

    const predicate = journalSetting.predicate;

    yield put(setJournalSetting(w(journalSetting)));
    yield put(initJournalSettingData(w({ journalSetting, predicate })));

    return journalSetting;
  } catch (e) {
    console.error('[journals getJournalSetting saga error', e.message);
  }
}

function* getJournalSharedSettings(api, id) {
  return id ? yield call(api.userConfig.getConfig, { id }) : null;
}

function* sagaInitJournalSettingData({ api, logger, stateId, w }, action) {
  try {
    const { journalSetting, predicate } = action.payload;
    const { journalConfig } = yield select(selectJournalData, stateId);
    const columnsSetup = {
      columns: (journalSetting.groupBy.length ? journalConfig.columns : journalSetting.columns).map(c => ({ ...c })),
      sortBy: journalSetting.sortBy.map(s => ({ ...s }))
    };
    const grouping = {
      columns: (journalSetting.groupBy.length ? journalSetting.columns : []).map(c => ({ ...c })),
      groupBy: journalSetting.groupBy.map(g => ({ ...g }))
    };

    yield put(setPredicate(w(predicate || journalSetting.predicate)));
    yield put(setColumnsSetup(w(columnsSetup)));
    yield put(setGrouping(w(grouping)));

    yield put(
      setOriginGridSettings(
        w({
          predicate: predicate || journalSetting.predicate,
          columnsSetup,
          grouping
        })
      )
    );
  } catch (e) {
    logger.error('[journals sagaInitJournalSettingData saga error', e.message);
  }
}

function* sagaResetJournalSettingData({ api, logger, stateId, w }, action) {
  try {
    const { journalConfig, originGridSettings, predicate, columnsSetup, grouping } = yield select(selectJournalData, stateId);

    if (!isEqual(originGridSettings, { predicate, columnsSetup, grouping })) {
      yield put(setPredicate(w(originGridSettings.predicate)));
      yield put(setColumnsSetup(w(originGridSettings.columnsSetup)));
      yield put(setGrouping(w(originGridSettings.grouping)));

      return;
    }

    const journalSettingId = action.payload;

    yield getJournalSetting(api, { journalSettingId, journalConfig, stateId }, w);
  } catch (e) {
    logger.error('[journals sagaResetJournalSettingData saga error', e.message);
  }
}

function* sagaRestoreJournalSettingData({ api, logger, stateId, w }, action) {
  try {
    let { isReset, ...journalSetting } = action.payload || {};

    if (isReset) {
      const { journalConfig, journalSetting: _jSet } = yield select(selectJournalData, stateId);
      const journalSettingId = get(_jSet, [JOURNAL_SETTING_ID_FIELD]) || '';

      journalSetting = yield getJournalSetting(api, { journalSettingId, journalConfig, stateId }, w);
      journalSetting.columns = yield JournalsService.resolveColumns(journalSetting.columns);
    }

    yield put(setJournalSetting(w(journalSetting)));
    yield put(initJournalSettingData(w({ journalSetting })));
  } catch (e) {
    logger.error('[journals sagaResetJournalSettingData saga error', e.message);
  }
}

function* getGridData(api, params, stateId) {
  const { recordRef, journalConfig, journalSetting } = yield select(selectJournalData, stateId);
  const config = yield select(state => selectNewVersionDashletConfig(state, stateId));
  const onlyLinked = get(config, 'onlyLinked');

  const { pagination: _pagination, predicates: _predicates, searchPredicate, ...forRequest } = params;
  const predicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(_predicates));
  const pagination = get(forRequest, 'groupBy.length') ? { ..._pagination, maxItems: undefined } : _pagination;

  const settings = JournalsConverter.getSettingsForDataLoaderServer({
    ...forRequest,
    recordRef,
    pagination,
    predicates,
    onlyLinked,
    searchPredicate,
    journalSetting
  });
  const resultData = yield call([JournalsService, JournalsService.getJournalData], journalConfig, settings);
  const journalData = JournalsConverter.getJournalDataWeb(resultData);
  const recordRefs = journalData.data.map(d => d.id);
  const resultActions = yield call([JournalsService, JournalsService.getRecordActions], journalConfig, recordRefs);
  const actions = JournalsConverter.getJournalActions(resultActions);
  const columns = yield getColumns({ stateId });

  return { ...journalData, columns, actions };
}

function* loadGrid(api, { journalSettingId, journalConfig, userConfigId, stateId }, w) {
  const sharedSettings = yield getJournalSharedSettings(api, userConfigId) || {};

  if (!isEmpty(sharedSettings) && !isEmpty(sharedSettings.columns)) {
    sharedSettings.columns = yield JournalsService.resolveColumns(sharedSettings.columns);
  }

  const journalSetting = yield getJournalSetting(api, { journalSettingId, journalConfig, sharedSettings, stateId }, w);
  const url = yield select(selectUrl, stateId);
  const journalData = yield select(selectJournalData, stateId);

  const pagination = get(sharedSettings, 'pagination') || get(journalData, 'grid.pagination') || {};
  const params = getGridParams({ journalConfig, journalSetting, pagination });
  const search = url.search || journalSetting.search;

  let gridData = yield getGridData(api, { ...params }, stateId);
  let searchData = {};

  if (search) {
    yield put(setGrid(w({ search })));
    searchData = { search };
  }

  if (search && !url.search) {
    yield put(setUrl({ stateId, ...url, search }));
  }

  const searchPredicate = yield getSearchPredicate({ ...w({ stateId }), grid: { ...gridData, ...searchData } });

  if (!isEmpty(searchPredicate)) {
    gridData = yield getGridData(api, { ...params, searchPredicate }, stateId);
  }

  const editingRules = yield getGridEditingRules(api, gridData);
  let selectedRecords = [];

  if (!!userConfigId) {
    if (isEmpty(get(sharedSettings, 'selectedItems'))) {
      selectedRecords = get(gridData, 'data', []).map(item => item.id);
    } else {
      selectedRecords = sharedSettings.selectedItems;
    }
  }

  yield put(setSelectedRecords(w(selectedRecords)));
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

function* sagaReloadGrid({ api, logger, stateId, w }, { payload = {} }) {
  try {
    yield put(setLoading(w(true)));

    const journalData = yield select(selectJournalData, stateId);
    const { grid, selectAllRecords } = journalData;
    const searchPredicate = get(payload, 'searchPredicate') || (yield getSearchPredicate({ logger, stateId }));
    const params = { ...grid, ...payload, searchPredicate };
    const gridData = yield getGridData(api, params, stateId);
    const editingRules = yield getGridEditingRules(api, gridData);

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
    const id = !customJournalMode || !customJournal ? journalId : customJournal;

    let { journalConfig } = yield select(selectJournalData, stateId);

    const isEmptyConfig = isEqual(journalConfig, emptyJournalConfig);
    const isNotExistsJournal = yield call([JournalsService, JournalsService.isNotExistsJournal], id);

    yield put(setJournalExistStatus(w(isNotExistsJournal !== true)));

    if (isEmpty(journalConfig) || isEmptyConfig) {
      journalConfig = yield getJournalConfig(api, id, w);

      yield getJournalSettings(api, journalConfig.id, w);
    }

    yield loadGrid(
      api,
      {
        journalSettingId,
        journalConfig,
        userConfigId,
        stateId
      },
      (...data) => ({ ...w(...data), logger })
    );
    yield call(loadDocumentLibrarySettings, journalConfig.id, w);

    yield put(setLoading(w(false)));

    if (yield select(state => selectIsNotExistsJournal(state, stateId))) {
      yield put(setEditorMode(w(true)));
    }
  } catch (e) {
    yield put(setLoading(w(false)));
    logger.error('[journals sagaInitJournal saga error', e.message);
  }
}

function* sagaOpenSelectedJournalSettings({ api, logger, stateId, w }, action) {
  try {
    const selectedId = action.payload;
    const query = getSearchParams();

    if (query[JournalUrlParams.JOURNAL_SETTING_ID] === undefined && selectedId === undefined) {
      return;
    }

    const { journalSetting } = yield select(selectJournalData, stateId);

    if (journalSetting[JOURNAL_SETTING_ID_FIELD] === selectedId) {
      return;
    }

    query[JournalUrlParams.JOURNAL_SETTING_ID] = selectedId || undefined;
    query[JournalUrlParams.USER_CONFIG_ID] = undefined;

    const url = queryString.stringifyUrl({ url: getUrlWithoutOrigin(), query });

    yield call(PageService.changeUrlLink, url, { updateUrl: true });
  } catch (e) {
    logger.error('[journals sagaOpenSelectedJournal saga error', e.message);
  }
}

function* sagaOnJournalSettingsSelect({ api, logger, stateId, w }, action) {
  try {
    yield put(setLoading(w(true)));

    const journalSettingId = action.payload;
    const { journalConfig } = yield select(selectJournalData, stateId);

    yield call(api.journals.setLsJournalSettingId, journalConfig.id, journalSettingId);
    yield loadGrid(api, { journalSettingId, journalConfig, stateId }, w);
    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[journals sagaOnJournalSettingsSelect saga error', e.message);
  }
}

function* sagaOpenSelectedJournal({ api, logger, stateId, w }, action) {
  try {
    const query = getSearchParams();

    if (query[JournalUrlParams.JOURNAL_ID] === (action.payload || undefined)) {
      return;
    }

    yield put(setLoading(w(true)));

    const exceptionalParams = [JournalUrlParams.JOURNALS_LIST_ID];

    for (let key in query) {
      if (!exceptionalParams.includes(key)) {
        query[key] = undefined;
      }
    }

    query[JournalUrlParams.JOURNAL_ID] = action.payload;

    const url = queryString.stringifyUrl({ url: getUrlWithoutOrigin(), query });

    yield call(PageService.changeUrlLink, url, { openNewTab: true, pushHistory: true });
  } catch (e) {
    logger.error('[journals sagaOpenSelectedJournal saga error', e.message);
  }
}

function* sagaOnJournalSelect({ api, logger, stateId, w }, action) {
  try {
    const journalId = action.payload;

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
    const { grid } = yield select(selectJournalData, stateId);
    const editingRules = yield getGridEditingRules(api, grid);
    const { id, attributes } = action.payload;
    const attribute = Object.keys(attributes)[0];
    const value = attributes[attribute];
    const tempAttributes = {};

    const currentColumn = grid.columns.find(item => item.attribute === attribute);

    const valueToSave = EditorService.getValueToSave(value, currentColumn.multiple);

    yield call(api.journals.saveRecords, {
      id,
      attributes: {
        [attribute]: valueToSave
      }
    });

    grid.columns.forEach(c => {
      tempAttributes[c.attribute] = c.attSchema;
    });

    const savedRecord = yield call(api.journals.getRecord, { id, attributes: tempAttributes, noCache: true });

    grid.data = grid.data.map(record => {
      if (record.id === id) {
        const savedValue = EditorService.getValueToSave(savedRecord[attribute], currentColumn.multiple);

        if (!isEqual(savedValue, valueToSave)) {
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

    const { journalConfig } = yield select(selectJournalData, stateId);

    yield loadGrid(api, { journalSettingId, journalConfig, stateId }, w);
  } catch (e) {
    logger.error('[journals sagaSaveJournalSetting saga error', e.message);
  }
}

function* sagaCreateJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const journalSettingId = yield call(api.journals.createJournalSetting, action.payload);
    const { journalConfig } = yield select(selectJournalData, stateId);

    yield getJournalSettings(api, journalConfig.id, w);
    yield put(openSelectedJournalSettings(w(journalSettingId)));
  } catch (e) {
    logger.error('[journals sagaCreateJournalSetting saga error', e.message);
  }
}

function* sagaDeleteJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const { journalConfig } = yield select(selectJournalData, stateId);

    yield call(api.journals.deleteJournalSetting, action.payload);
    yield getJournalSettings(api, journalConfig.id, w);
    yield put(openSelectedJournalSettings(''));
  } catch (e) {
    logger.error('[journals sagaCreateJournalSetting saga error', e.message);
  }
}

function* sagaRenameJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const { id: journalSettingId, title } = action.payload;

    const { journalConfig } = yield select(selectJournalData, stateId);
    const journalSetting = yield call(api.journals.getJournalSetting, journalSettingId);

    if (get(journalSetting, 'error')) {
      NotificationManager.error(t('journal.error.fail-get-settings-template'));
      return;
    }

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
    const journalData = yield select(selectJournalData, stateId);
    const { journalConfig = {}, grid = {} } = journalData;
    const { columns, groupBy = [] } = grid;

    let row = cloneDeep(action.payload);
    let {
      id = '',
      meta: { criteria = [], predicate = {} }
    } = journalConfig;
    let filter = '';

    if (id === 'event-lines-stat') {
      //todo: move to journal config
      let eventTypeId = row['groupBy__type'];
      if (eventTypeId) {
        eventTypeId = eventTypeId.replace('emodel/type@line-', '');
        id = 'event-lines-' + eventTypeId;
        NotificationManager.info('', t('notification.journal-will-be-opened-soon'), 1000);
        PageService.changeUrlLink('/v2/journals?journalId=' + id, { updateUrl: true });
        return;
      } else {
        console.error("Target journal can't be resolved", row);
      }
    } else {
      const journalType = (criteria[0] || {}).value || predicate.val;

      if (journalType && journalConfig.groupBy && journalConfig.groupBy.length) {
        const journalConfig = yield call(JournalsService.getJournalConfig, `alf_${encodeURI(journalType)}`);
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

      filter = getFilterParam({ row, columns, groupBy });
    }

    if (filter) {
      yield call(api.journals.setLsJournalSettingId, id, '');
    }

    const journalSetting = yield getJournalSetting(api, { journalConfig, stateId }, w);
    const params = getGridParams({ journalConfig, journalSetting });
    const predicateValue = ParserPredicate.setPredicateValue(get(params, 'predicates[0]') || [], filter);
    set(params, 'predicates', [predicateValue]);
    const gridData = yield getGridData(api, { ...params }, stateId);
    const editingRules = yield getGridEditingRules(api, gridData);

    yield put(setSelectedRecords(w([])));
    yield put(setSelectAllRecordsVisible(w(false)));
    yield put(setGridInlineToolSettings(w(DEFAULT_INLINE_TOOL_SETTINGS)));
    yield put(setPreviewUrl(w('')));
    yield put(setPreviewFileName(w('')));
    yield put(setGrid(w({ ...params, ...gridData, editingRules })));
  } catch (e) {
    logger.error('[journals sagaGoToJournalsPage saga error', e.message);
  }
}

function* getSearchPredicate({ logger, stateId, grid }) {
  try {
    const journalData = yield select(selectJournalData, stateId);
    let { journalConfig, grid: gridData } = journalData;
    const fullSearch = get(journalConfig, ['params', 'full-search-predicate']);
    let predicate;

    if (!isEmpty(grid)) {
      gridData = { ...gridData, ...grid };
    }

    const { groupBy = [], search } = gridData;
    let { columns = [] } = gridData;

    columns = columns.filter(item => {
      return ![COLUMN_DATA_TYPE_DATE, COLUMN_DATA_TYPE_DATETIME].includes(item.type);
    });

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
    logger.error('[journals getSearchPredicate saga error', e.message);
  }
}

function* sagaSearch({ logger, w, stateId }, { payload }) {
  try {
    const urlData = queryString.parseUrl(getUrlWithoutOrigin());
    const searchText = get(payload, 'text', '');

    if (searchText && get(urlData, ['query', JournalUrlParams.SEARCH]) !== searchText) {
      set(urlData, ['query', JournalUrlParams.SEARCH], searchText);
    }

    if (searchText === '' && has(urlData, ['query', JournalUrlParams.SEARCH])) {
      delete urlData.query[JournalUrlParams.SEARCH];
    }

    if (!isEqual(getSearchParams(), urlData.query)) {
      yield put(setLoading(w(true)));
      yield call(PageService.changeUrlLink, decodeLink(queryString.stringifyUrl(urlData)), { updateUrl: true });
    }
  } catch (e) {
    logger.error('[journals sagaSearch saga error', e.message);
  }
}

function* sagaCheckConfig({ logger, w, stateId }, { payload }) {
  try {
    yield put(setCheckLoading(w(true)));

    const config = get(payload, get(payload, 'version'));
    const customJournalMode = get(config, 'customJournalMode');
    const id = get(config, customJournalMode ? 'customJournal' : 'journalId', '');
    const isCalculated = id.indexOf('${') !== -1;
    const isNotExistsJournal = yield call([JournalsService, JournalsService.isNotExistsJournal], id);
    const passedCheck = !(isEmpty(id) || isCalculated || isNotExistsJournal);

    yield put(setJournalExistStatus(w(passedCheck)));
    yield put(setCheckLoading(w(false)));
    yield put(setEditorMode(w(!passedCheck)));
  } catch (e) {
    logger.error('[journals sagaCheckConfig saga error', e.message);
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
  yield takeEvery(openSelectedJournal().type, wrapSaga, { ...ea, saga: sagaOpenSelectedJournal });
  yield takeEvery(openSelectedJournalSettings().type, wrapSaga, { ...ea, saga: sagaOpenSelectedJournalSettings });
  yield takeEvery(initJournalSettingData().type, wrapSaga, { ...ea, saga: sagaInitJournalSettingData });
  yield takeEvery(resetJournalSettingData().type, wrapSaga, { ...ea, saga: sagaResetJournalSettingData });
  yield takeEvery(restoreJournalSettingData().type, wrapSaga, { ...ea, saga: sagaRestoreJournalSettingData });

  yield takeEvery(initPreview().type, wrapSaga, { ...ea, saga: sagaInitPreview });
  yield takeEvery(goToJournalsPage().type, wrapSaga, { ...ea, saga: sagaGoToJournalsPage });
  yield takeEvery(runSearch().type, wrapSaga, { ...ea, saga: sagaSearch });
  yield takeEvery(checkConfig().type, wrapSaga, { ...ea, saga: sagaCheckConfig });
}

export default saga;
