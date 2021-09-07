import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import * as queryString from 'query-string';
import get from 'lodash/get';
import getFirst from 'lodash/first';
import set from 'lodash/set';
import has from 'lodash/has';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';

import { NotificationManager } from 'react-notifications';

import {
  applyJournalSetting,
  checkConfig,
  createJournalSetting,
  deleteJournalSetting,
  execJournalAction,
  execRecordsAction,
  getDashletConfig,
  getDashletEditorData,
  getJournalsData,
  goToJournalsPage,
  initJournal,
  initJournalSettingData,
  initPreview,
  openSelectedJournal,
  openSelectedJournalSettings,
  reloadGrid,
  reloadTreeGrid,
  renameJournalSetting,
  resetFiltering,
  resetJournalSettingData,
  restoreJournalSettingData,
  runSearch,
  saveDashlet,
  saveJournalSetting,
  saveRecords,
  selectJournal,
  selectJournalSettings,
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
  selectGridPaginationMaxItems,
  selectJournalData,
  selectNewVersionDashletConfig,
  selectSettingsData,
  selectUrl
} from '../selectors/journals';
import JournalsService from '../components/Journals/service';
import EditorService from '../components/Journals/service/editors/EditorService';
import {
  DEFAULT_INLINE_TOOL_SETTINGS,
  DEFAULT_PAGINATION,
  JOURNAL_DASHLET_CONFIG_VERSION,
  JOURNAL_SETTING_ID_FIELD
} from '../components/Journals/constants';
import { ParserPredicate } from '../components/Filters/predicates';
import Records from '../components/Records';
import { ActionTypes } from '../components/Records/actions';
import { COLUMN_DATA_TYPE_DATE, COLUMN_DATA_TYPE_DATETIME } from '../components/Records/predicates/predicates';
import { decodeLink, getFilterParam, getSearchParams, getUrlWithoutOrigin, removeUrlSearchParams } from '../helpers/urls';
import { wrapSaga } from '../helpers/redux';
import { beArray, hasInString, t } from '../helpers/util';
import PageService from '../services/PageService';
import JournalsConverter from '../dto/journals';
import { emptyJournalConfig } from '../reducers/journals';
import { JournalUrlParams } from '../constants';

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

export function getGridParams({ journalConfig = {}, journalSetting = {}, pagination = DEFAULT_PAGINATION }) {
  const { createVariants, actions: journalActions, groupActions } = get(journalConfig, 'meta', {});
  const { sourceId, id: journalId } = journalConfig;
  const { sortBy, groupBy, columns, predicate: journalSettingPredicate } = journalSetting;
  const predicates = beArray(journalSettingPredicate);

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
    logger.error('[journals sagaGetDashletEditorData saga error', e);
  }
}

function* sagaGetDashletConfig({ api, logger, stateId, w }, action) {
  try {
    const config = yield call(api.journals.getDashletConfig, action.payload);

    if (config) {
      const { journalId, journalSettingId = '', customJournal, customJournalMode, journalsListIds } = config;

      yield put(setEditorMode(w(isEmpty(journalsListIds))));
      yield put(setDashletConfig(w(config)));
      yield put(initJournal(w({ journalId, journalSettingId, customJournal, customJournalMode })));
    } else {
      yield put(setEditorMode(w(true)));
    }
  } catch (e) {
    logger.error('[journals sagaGetDashletConfig saga error', e);
  }
}

function* sagaSetDashletConfigFromParams({ api, logger, stateId, w }, action) {
  try {
    const { config = {}, lsJournalId, recordRef } = action.payload;

    if (isEmpty(config) || config.version !== JOURNAL_DASHLET_CONFIG_VERSION) {
      yield put(setEditorMode(w(true)));
      yield put(setLoading(w(false)));
      return;
    }

    const { journalId: configJournalId, journalSettingId = '', customJournal, customJournalMode, journalsListIds } = config[
      JOURNAL_DASHLET_CONFIG_VERSION
    ];
    const headJournalsListId = getFirst(journalsListIds);

    let editorMode = false;
    let journalId = configJournalId || lsJournalId;
    let dataInitJournal;

    switch (true) {
      case !!(customJournalMode && customJournal):
        journalId = yield _resolveTemplate(recordRef, customJournal);
        dataInitJournal = { journalId };
        break;
      case !!headJournalsListId:
        let selectedJournals = yield call(api.journals.getJournalsByIds, journalsListIds, { id: 'id', title: '.disp' });
        yield put(setSelectedJournals(w(selectedJournals)));
        journalId = headJournalsListId;
        dataInitJournal = { journalId, journalSettingId };
        break;
      case !!journalId:
        dataInitJournal = { journalId, journalSettingId };
        break;
      default:
        editorMode = true;
        yield put(setLoading(w(false)));
        break;
    }

    yield put(setDashletConfig(w(config)));
    dataInitJournal && (yield put(initJournal(w(dataInitJournal))));
    yield put(setEditorMode(w(editorMode)));
  } catch (e) {
    logger.error('[journals sagaSetDashletConfigFromParams saga error', e);
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
    const { journalId, journalSettingId = '', userConfigId } = url;

    yield put(setGrid(w({ pagination: DEFAULT_PAGINATION })));
    yield put(initJournal(w({ journalId, journalSettingId, userConfigId, force: payload.force })));
  } catch (e) {
    logger.error('[journals sagaGetJournalsData saga error', e);
  }
}

function* getJournalSettings(api, journalId, w) {
  const settings = yield call(api.journals.getJournalSettings, journalId);

  yield put(setJournalSettings(w(settings)));

  return settings;
}

export function* getJournalConfig({ api, w, force }, journalId) {
  const journalConfig = yield call([JournalsService, JournalsService.getJournalConfig], journalId, force);
  yield put(setJournalConfig(w(journalConfig)));
  return journalConfig;
}

function* getColumns({ stateId }) {
  const { journalConfig = {}, journalSetting = {}, grouping = {} } = yield select(selectJournalData, stateId);
  const groupingColumns = get(grouping, 'columns');
  const columns = yield JournalsService.resolveColumns(isEmpty(groupingColumns) ? journalSetting.columns : groupingColumns);

  if (columns.length) {
    return columns.map(setting => {
      const config = journalConfig.columns.find(column => column.attribute === setting.attribute);
      return config ? { ...config, ...setting, sortable: config.sortable } : setting;
    });
  }

  return columns;
}

export function* getJournalSettingFully(api, { journalConfig, stateId }, w) {
  const url = yield select(selectUrl, stateId);
  const { journalSettingId = '', userConfigId } = url;

  const sharedSettings = yield getJournalSharedSettings(api, userConfigId) || {};

  if (!isEmpty(sharedSettings) && !isEmpty(sharedSettings.columns)) {
    sharedSettings.columns = yield JournalsService.resolveColumns(sharedSettings.columns);
  }

  return yield getJournalSetting(api, { journalSettingId, journalConfig, sharedSettings, stateId }, w);
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
    console.error('[journals getJournalSetting saga error', e);
  }
}

function* getJournalSharedSettings(api, id) {
  return id ? yield call(api.userConfig.getConfig, { id }) : null;
}

function* sagaInitJournalSettingData({ api, logger, stateId, w }, action) {
  try {
    const { journalSetting = {}, predicate } = action.payload;
    const columnsSetup = {
      columns: JournalsConverter.injectId(journalSetting.columns),
      sortBy: cloneDeep(journalSetting.sortBy)
    };
    const grouping = {
      columns: cloneDeep(journalSetting.groupBy.length ? journalSetting.grouping.columns : []),
      groupBy: cloneDeep(journalSetting.groupBy)
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
    logger.error('[journals sagaInitJournalSettingData saga error', e);
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
    logger.error('[journals sagaResetJournalSettingData saga error', e);
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
    logger.error('[journals sagaResetJournalSettingData saga error', e);
  }
}

function* getGridData(api, params, stateId) {
  const { recordRef, journalConfig, journalSetting } = yield select(selectJournalData, stateId);
  const config = yield select(state => selectNewVersionDashletConfig(state, stateId));
  const onlyLinked = get(config, 'onlyLinked');

  const { pagination: _pagination, predicates: _predicates, searchPredicate, grouping, ...forRequest } = params;
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

  if (get(grouping, 'groupBy', []).length) {
    settings.columns = grouping.columns;
  }

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

  const pagination = get(sharedSettings, 'pagination') || get(journalData, 'grid.pagination') || DEFAULT_PAGINATION;
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
    logger.error('[journals sagaReloadGrid saga error', e);
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
    logger.error('[journals sagaReloadTreeGrid saga error', e);
  }
}

function* sagaSaveDashlet({ api, logger, stateId, w }, action) {
  try {
    const { id, config } = action.payload;

    yield call(api.journals.saveDashletConfig, config, id);
    yield put(getDashletConfig(w(id)));
  } catch (e) {
    logger.error('[journals sagaSaveDashlet saga error', e);
  }
}

function* sagaInitJournal({ api, logger, stateId, w }, action) {
  try {
    yield put(setLoading(w(true)));

    const { journalId, journalSettingId, userConfigId, customJournal, customJournalMode, force } = action.payload;
    const id = !customJournalMode || !customJournal ? journalId : customJournal;

    let { journalConfig } = yield select(selectJournalData, stateId);

    const isEmptyConfig = isEqual(journalConfig, emptyJournalConfig);
    const isNotExistsJournal = yield call([JournalsService, JournalsService.isNotExistsJournal], id);

    yield put(setJournalExistStatus(w(isNotExistsJournal !== true)));

    if (isEmpty(journalConfig) || isEmptyConfig || force) {
      journalConfig = yield getJournalConfig({ api, w, force }, id);

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

    yield put(setLoading(w(false)));
  } catch (e) {
    yield put(setLoading(w(false)));
    logger.error('[journals sagaInitJournal saga error', e);
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
    logger.error('[journals sagaOpenSelectedJournal saga error', e);
  }
}

function* sagaSelectJournalSettings({ api, logger, stateId, w }, action) {
  try {
    yield put(setLoading(w(true)));

    const journalSettingId = action.payload;
    const { journalConfig } = yield select(selectJournalData, stateId);

    yield call(api.journals.setLsJournalSettingId, journalConfig.id, journalSettingId);
    yield loadGrid(api, { journalSettingId, journalConfig, stateId }, w);
    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[journals sagaSelectJournalSettings saga error', e);
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
    logger.error('[journals sagaOpenSelectedJournal saga error', e);
  }
}

function* sagaSelectJournal({ api, logger, stateId, w }, action) {
  try {
    const journalId = action.payload;

    yield put(setLoading(w(true)));

    const journalConfig = yield getJournalConfig({ api, w }, journalId);

    yield getJournalSettings(api, journalConfig.id, w);
    yield loadGrid(api, { journalConfig, stateId }, w);
    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[journals sagaSelectJournal saga error', e);
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
    logger.error('[journals sagaExecRecordsAction saga error', e);
  }
}

function* sagaSaveRecords({ api, logger, stateId, w }, action) {
  try {
    const { grid } = yield select(selectJournalData, stateId);
    const editingRules = yield getGridEditingRules(api, grid);
    const { id, attributes } = action.payload;
    const attribute = getFirst(Object.keys(attributes));
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
    logger.error('[journals sagaSaveRecords saga error', e);
  }
}

function* sagaSaveJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const { id: journalSettingId } = action.payload;

    yield call(api.journals.saveJournalSetting, action.payload);

    const { journalConfig } = yield select(selectJournalData, stateId);

    yield loadGrid(api, { journalSettingId, journalConfig, stateId }, w);
  } catch (e) {
    logger.error('[journals sagaSaveJournalSetting saga error', e);
  }
}

function* sagaCreateJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const journalSettingId = yield call(api.journals.createJournalSetting, action.payload);
    const { journalConfig } = yield select(selectJournalData, stateId);

    yield getJournalSettings(api, journalConfig.id, w);
    yield put(openSelectedJournalSettings(w(journalSettingId)));
  } catch (e) {
    logger.error('[journals sagaCreateJournalSetting saga error', e);
  }
}

function* sagaDeleteJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const { journalConfig } = yield select(selectJournalData, stateId);

    yield call(api.journals.deleteJournalSetting, action.payload);
    yield getJournalSettings(api, journalConfig.id, w);
    yield put(openSelectedJournalSettings(''));
  } catch (e) {
    logger.error('[journals sagaCreateJournalSetting saga error', e);
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
    logger.error('[journals sagaRenameJournalSetting saga error', e);
  }
}

function* sagaApplyJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const { settings } = action.payload;
    const { columns, groupBy, sortBy, predicate, grouping } = settings;
    const predicates = beArray(predicate);
    const maxItems = yield select(selectGridPaginationMaxItems, stateId);
    const pagination = { ...DEFAULT_PAGINATION, maxItems };

    yield put(setJournalSetting(w(settings)));
    yield put(setPredicate(w(predicate)));

    yield put(setColumnsSetup(w({ columns, sortBy })));
    yield put(setGrouping(w(grouping)));
    const newCols = grouping.groupBy.length ? grouping.columns : columns;
    yield put(setGrid(w({ columns: newCols })));
    yield put(
      reloadGrid(
        w({
          columns: newCols,
          groupBy,
          sortBy,
          predicates,
          pagination,
          grouping,
          search: ''
        })
      )
    );
  } catch (e) {
    logger.error('[journals sagaApplyJournalSetting saga error', e);
  }
}

function* sagaInitPreview({ api, logger, stateId, w }, action) {
  try {
    const nodeRef = action.payload;
    const previewUrl = yield call(api.journals.getPreviewUrl, nodeRef);

    yield put(setPreviewUrl(w(previewUrl)));
  } catch (e) {
    logger.error('[journals sagaInitPreview saga error', e);
  }
}

function* sagaGoToJournalsPage({ api, logger, stateId, w }, action) {
  try {
    const journalData = yield select(selectJournalData, stateId);
    const { journalConfig = {}, grid = {} } = journalData || {};
    const { columns, groupBy = [] } = grid;
    const { criteria = [], predicate = {} } = journalConfig.meta || {};

    let row = cloneDeep(action.payload);
    let id = journalConfig.id || '';
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
      const journalType = (getFirst(criteria) || {}).value || predicate.val;

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
    logger.error('[journals sagaGoToJournalsPage saga error', e);
  }
}

function* getSearchPredicate({ logger, stateId, grid }) {
  try {
    const journalData = yield select(selectJournalData, stateId);
    let { journalConfig, grid: gridData = {} } = journalData;
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
    logger.error('[journals getSearchPredicate saga error', e);
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
    logger.error('[journals sagaSearch saga error', e);
  }
}

function* sagaCheckConfig({ logger, w, stateId }, { payload }) {
  try {
    yield put(setCheckLoading(w(true)));

    const config = get(payload, get(payload, 'version'));
    const customJournalMode = get(config, 'customJournalMode');
    const id = get(config, customJournalMode ? 'customJournal' : 'journalId', '');
    const isNotExistsJournal = !!id && (yield call([JournalsService, JournalsService.isNotExistsJournal], id));

    yield put(setJournalExistStatus(w(!isNotExistsJournal)));
    yield put(setCheckLoading(w(false)));
    yield put(setEditorMode(w(isEmpty(id))));
  } catch (e) {
    logger.error('[journals sagaCheckConfig saga error', e);
  }
}

function* sagaExecJournalAction({ api, logger, w, stateId }, { payload }) {
  try {
    const actionResult = yield call(api.recordActions.executeAction, payload);

    if (actionResult) {
      yield put(getJournalsData(w({ force: true })));
    }
  } catch (e) {
    logger.error('[journals sagaExecJournalAction saga error', e);
  }
}

function* sagaResetFiltering({ logger, w, stateId }) {
  try {
    const {
      originGridSettings: { predicate }
    } = yield select(selectSettingsData, stateId);
    const maxItems = yield select(selectGridPaginationMaxItems, stateId);
    const pagination = { ...DEFAULT_PAGINATION, maxItems };
    const predicates = beArray(predicate);

    yield put(setPredicate(w(predicate)));
    yield put(setJournalSetting(w({ predicate })));
    yield put(reloadGrid(w({ predicates, pagination })));
  } catch (e) {
    logger.error('[journals sagaResetFiltering saga error', e);
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
  yield takeEvery(applyJournalSetting().type, wrapSaga, { ...ea, saga: sagaApplyJournalSetting });
  yield takeEvery(resetFiltering().type, wrapSaga, { ...ea, saga: sagaResetFiltering });
  yield takeEvery(execJournalAction().type, wrapSaga, { ...ea, saga: sagaExecJournalAction });

  yield takeEvery(openSelectedJournalSettings().type, wrapSaga, { ...ea, saga: sagaOpenSelectedJournalSettings });
  yield takeEvery(selectJournalSettings().type, wrapSaga, { ...ea, saga: sagaSelectJournalSettings });
  yield takeEvery(openSelectedJournal().type, wrapSaga, { ...ea, saga: sagaOpenSelectedJournal });
  yield takeEvery(selectJournal().type, wrapSaga, { ...ea, saga: sagaSelectJournal });

  yield takeEvery(initJournalSettingData().type, wrapSaga, { ...ea, saga: sagaInitJournalSettingData });
  yield takeEvery(resetJournalSettingData().type, wrapSaga, { ...ea, saga: sagaResetJournalSettingData });
  yield takeEvery(restoreJournalSettingData().type, wrapSaga, { ...ea, saga: sagaRestoreJournalSettingData });

  yield takeEvery(initPreview().type, wrapSaga, { ...ea, saga: sagaInitPreview });
  yield takeEvery(goToJournalsPage().type, wrapSaga, { ...ea, saga: sagaGoToJournalsPage });
  yield takeEvery(runSearch().type, wrapSaga, { ...ea, saga: sagaSearch });
  yield takeEvery(checkConfig().type, wrapSaga, { ...ea, saga: sagaCheckConfig });
}

export default saga;
