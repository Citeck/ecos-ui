import { put, call, select, takeEvery } from 'redux-saga/effects';
import cloneDeep from 'lodash/cloneDeep';
import {
  getDashletEditorData,
  getDashletConfig,
  getJournalsData,
  saveDashlet,
  setGrid,
  setEditorMode,
  setJournalsList,
  setJournals,
  setDashletConfig,
  reloadGrid,
  initJournal,
  reloadTreeGrid,
  setJournalConfig,
  deleteRecords,
  saveRecords,
  setSelectedRecords,
  saveJournalSetting,
  createJournalSetting,
  deleteJournalSetting,
  setJournalSetting,
  setJournalSettings,
  setPredicate,
  setColumnsSetup,
  setGrouping,
  initJournalSettingData,
  onJournalSettingsSelect,
  onJournalSelect,
  initPreview,
  setPreviewUrl,
  goToJournalsPage,
  search,
  performGroupAction,
  setPerformGroupActionResponse,
  createZip,
  setZipNodeRef,
  renameJournalSetting,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setGridInlineToolSettings
} from '../actions/journals';
import { setLoading } from '../actions/loader';
import { JOURNAL_SETTING_ID_FIELD, DEFAULT_PAGINATION, DEFAULT_INLINE_TOOL_SETTINGS } from '../components/Journals/constants';
import { ParserPredicate } from '../components/Filters/predicates';
import { goToJournalsPage as goToJournalsPageUrl, getFilterUrlParam } from '../helpers/urls';
import { t } from '../helpers/util';
import { wrapSaga } from '../helpers/redux';

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

function getGridParams(journalConfig, journalSetting, stateId) {
  const {
    meta: { createVariants, predicate },
    sourceId
  } = journalConfig;
  const { sortBy, groupBy, columns, predicate: journalSettingPredicate } = journalSetting;

  return {
    createVariants,
    predicate,
    sourceId: sourceId,
    sortBy: sortBy.map(sort => ({ ...sort })),
    columns: columns.map(col => ({ ...col })),
    groupBy: Array.from(groupBy),
    predicates: journalSettingPredicate ? [{ ...journalSettingPredicate }] : [],
    pagination: DEFAULT_PAGINATION
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
      yield put(setEditorMode(w(false)));
      yield put(setDashletConfig(w(config)));

      const { journalsListId, journalId, journalSettingId = '' } = config;
      yield getJournals(api, journalsListId, w);

      yield put(initJournal(w({ journalId, journalSettingId })));
    } else {
      yield put(setEditorMode(w(true)));
    }
  } catch (e) {
    logger.error('[journals sagaGetDashletConfig saga error', e.message);
  }
}

function* sagaGetJournalsData({ api, logger, stateId, w }) {
  try {
    const url = yield select(state => state.journals[stateId].url);
    const { journalsListId, journalId, journalSettingId = '' } = url;
    yield getJournals(api, journalsListId, w);

    yield put(initJournal(w({ journalId, journalSettingId })));
  } catch (e) {
    logger.error('[journals sagaGetDashletConfig saga error', e.message);
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
  yield put(setJournals(w(journals)));
}

function* getJournalSettings(api, journalId, w) {
  const settings = yield call(api.journals.getJournalSettings, journalId);
  yield put(setJournalSettings(w(settings)));
}

function* getJournalConfig(api, journalId, w) {
  let journalConfig = yield call(api.journals.getJournalConfig, journalId);
  journalConfig.columns = journalConfig.columns.map(c => ({ ...c, text: t(c.text) }));
  yield put(setJournalConfig(w(journalConfig)));
  return journalConfig;
}

function* getJournalSetting(api, journalSettingId, journalConfig, stateId, w) {
  const url = yield select(state => state.journals[stateId].url);

  let journalSetting;

  journalSettingId = journalSettingId || journalConfig.journalSettingId || api.journals.getLsJournalSettingId(journalConfig.id);

  if (journalSettingId) {
    journalSetting = yield call(api.journals.getJournalSetting, journalSettingId);
  }

  if (!journalSetting) {
    journalSettingId = '';
    journalSetting = getDefaultJournalSetting(journalConfig);
  }

  journalSetting = { ...journalSetting, [JOURNAL_SETTING_ID_FIELD]: journalSettingId };
  journalSetting.predicate = url.filter ? JSON.parse(url.filter) : null || journalSetting.predicate;

  yield put(setJournalSetting(w(journalSetting)));
  yield put(initJournalSettingData(w(journalSetting)));

  return journalSetting;
}

function* sagaInitJournalSettingData({ api, logger, stateId, w }, action) {
  try {
    const journalSetting = action.payload;
    const journalConfig = yield select(state => state.journals[stateId].journalConfig);

    yield put(setPredicate(w(journalSetting.predicate)));

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

function* getGridData(api, params) {
  let { pagination, predicates, ...forRequest } = params;

  return yield call(api.journals.getGridData, {
    ...forRequest,
    predicates: ParserPredicate.removeEmptyPredicates(cloneDeep(predicates)),
    pagination: forRequest.groupBy.length ? { ...pagination, maxItems: undefined } : pagination
  });
}

function* loadGrid(api, journalSettingId, journalConfig, stateId, w) {
  let journalSetting = yield getJournalSetting(api, journalSettingId, journalConfig, stateId, w);
  let params = getGridParams(journalConfig, journalSetting, stateId);

  const gridData = yield getGridData(api, params);

  yield put(setSelectedRecords(w([])));
  yield put(setSelectAllRecords(w(false)));
  yield put(setSelectAllRecordsVisible(w(false)));
  yield put(setGridInlineToolSettings(w(DEFAULT_INLINE_TOOL_SETTINGS)));
  yield put(setPerformGroupActionResponse(w([])));
  yield put(setPreviewUrl(w('')));

  yield put(setGrid(w({ ...params, ...gridData })));
}

function* sagaReloadGrid({ api, logger, stateId, w }, action) {
  try {
    yield put(setLoading(w(true)));

    const { columns } = yield select(state => state.journals[stateId].journalConfig);
    const grid = yield select(state => state.journals[stateId].grid);

    grid.columns = columns;
    //grid.pagination = DEFAULT_PAGINATION;

    let params = {
      ...grid,
      ...(action.payload || {})
    };

    const gridData = yield getGridData(api, params);

    yield put(setGrid(w({ ...params, ...gridData })));

    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[journals sagaReloadGrid saga error', e.message);
  }
}

function* sagaReloadTreeGrid({ api, logger, stateId, w }) {
  try {
    yield put(setLoading(w(true)));

    const gridData = yield call(api.journals.getTreeGridData);
    yield put(setGrid(w(gridData)));

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

    let { journalId, journalSettingId } = action.payload;

    const journalConfig = yield getJournalConfig(api, journalId, w);
    yield getJournalSettings(api, journalConfig.id, w);
    yield loadGrid(api, journalSettingId, journalConfig, stateId, w);

    yield put(setLoading(w(false)));
  } catch (e) {
    yield put(setLoading(w(false)));
    logger.error('[journals sagaInitJournal saga error', e.message);
  }
}

function* sagaOnJournalSettingsSelect({ api, logger, stateId, w }, action) {
  try {
    yield put(setLoading(w(true)));

    let journalSettingId = action.payload;
    let journalConfig = yield select(state => state.journals[stateId].journalConfig);

    api.journals.setLsJournalSettingId(journalConfig.id, journalSettingId);

    yield loadGrid(api, journalSettingId, journalConfig, stateId, w);

    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[journals sagaOnJournalSettingsSelect saga error', e.message);
  }
}

function* sagaOnJournalSelect({ api, logger, stateId, w }, action) {
  try {
    yield put(setLoading(w(true)));

    let journalId = action.payload;
    const journalConfig = yield getJournalConfig(api, journalId, w);

    yield getJournalSettings(api, journalConfig.id, w);
    yield loadGrid(api, null, journalConfig, stateId, w);

    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[journals sagaOnJournalSelect saga error', e.message);
  }
}

function* sagaDeleteRecords({ api, logger, stateId, w }, action) {
  try {
    yield put(setLoading(w(true)));
    yield call(api.journals.deleteRecords, action.payload);
    yield put(setLoading(w(false)));

    yield put(reloadGrid(w({})));
    yield put(setSelectedRecords(w([])));
  } catch (e) {
    logger.error('[journals sagaDeleteRecords saga error', e.message);
  }
}

function* sagaSaveRecords({ api, logger, stateId, w }, action) {
  try {
    yield call(api.journals.saveRecords, action.payload);
  } catch (e) {
    logger.error('[journals sagaSaveRecords saga error', e.message);
  }
}

function* sagaSaveJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const { id: journalSettingId } = action.payload;
    yield call(api.journals.saveJournalSetting, action.payload);

    let journalConfig = yield select(state => state.journals[stateId].journalConfig);
    yield loadGrid(api, journalSettingId, journalConfig, stateId, w);
  } catch (e) {
    logger.error('[journals sagaSaveJournalSetting saga error', e.message);
  }
}

function* sagaCreateJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const journalSettingId = yield call(api.journals.createJournalSetting, action.payload);
    let journalConfig = yield select(state => state.journals[stateId].journalConfig);
    yield getJournalSettings(api, journalConfig.id, w);

    yield put(onJournalSettingsSelect(w(journalSettingId)));
  } catch (e) {
    logger.error('[journals sagaCreateJournalSetting saga error', e.message);
  }
}

function* sagaDeleteJournalSetting({ api, logger, stateId, w }, action) {
  try {
    yield call(api.journals.deleteJournalSetting, action.payload);

    let journalConfig = yield select(state => state.journals[stateId].journalConfig);
    yield getJournalSettings(api, journalConfig.id, w);
    yield loadGrid(api, '', journalConfig, stateId, w);
  } catch (e) {
    logger.error('[journals sagaCreateJournalSetting saga error', e.message);
  }
}

function* sagaRenameJournalSetting({ api, logger, stateId, w }, action) {
  try {
    const { id: journalSettingId, title } = action.payload;

    let journalConfig = yield select(state => state.journals[stateId].journalConfig);

    let journalSetting = yield call(api.journals.getJournalSetting, journalSettingId);

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

    const journalType = (criteria[0] || {}).value || predicate.val;

    if (journalType) {
      let journalConfig = yield call(api.journals.getJournalConfig, `alf_${encodeURI(journalType)}`);
      nodeRef = journalConfig.meta.nodeRef;
    }

    let attributes = {};

    columns.forEach(c => (attributes[c.attribute] = `${c.attribute}?str`));

    if (groupBy.length) {
      for (let key in row) {
        if (!row.hasOwnProperty(key)) {
          continue;
        }

        const value = row[key];

        if (value && value.str) {
          row[key] = value.str;
        }
      }
    } else {
      row = yield call(api.journals.getRecord, { id: row.id, attributes: attributes }) || row;
    }

    goToJournalsPageUrl({
      journalsListId,
      journalId: id,
      journalSettingId,
      nodeRef,
      filter: getFilterUrlParam({ row, columns, groupBy })
    });
  } catch (e) {
    logger.error('[journals sagaGoToJournalsPage saga error', e.message);
  }
}

function* sagaSearch({ api, logger, stateId, w }, action) {
  try {
    let text = action.payload;
    const journalConfig = yield select(state => state.journals[stateId].journalConfig);
    const grid = yield select(state => state.journals[stateId].grid);
    const { columns, groupBy = [] } = grid;

    const predicates = ParserPredicate.getSearchPredicates({ text, columns, groupBy });

    yield put(reloadGrid(w({ columns: journalConfig.columns, predicates: predicates ? [predicates] : null })));
  } catch (e) {
    logger.error('[journals sagaSearch saga error', e.message);
  }
}

function* sagaPerformGroupAction({ api, logger, stateId, w }, action) {
  try {
    let { groupAction, selected } = action.payload;
    const journalConfig = yield select(state => state.journals[stateId].journalConfig);

    const performGroupActionResponse = yield call(api.journals.performGroupAction, {
      groupAction,
      selected,
      criteria: journalConfig.meta.criteria,
      journalId: journalConfig.id
    });

    if (performGroupActionResponse.length) {
      yield put(setSelectedRecords(w([])));
      yield put(reloadGrid(w({})));
      yield put(setPerformGroupActionResponse(w(performGroupActionResponse)));
    }
  } catch (e) {
    logger.error('[journals sagaPerformGroupAction saga error', e.message);
  }
}

function* sagaCreateZip({ api, logger, stateId, w }, action) {
  try {
    let selected = action.payload;

    const nodeRef = yield call(api.journals.createZip, selected);

    if (nodeRef) {
      yield call(api.journals.deleteDownloadsProgress, nodeRef);
      yield put(setZipNodeRef(w(nodeRef)));
    }
  } catch (e) {
    logger.error('[journals sagaCreateZip saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getDashletConfig().type, wrapSaga, { ...ea, saga: sagaGetDashletConfig });
  yield takeEvery(getDashletEditorData().type, wrapSaga, { ...ea, saga: sagaGetDashletEditorData });
  yield takeEvery(getJournalsData().type, wrapSaga, { ...ea, saga: sagaGetJournalsData });
  yield takeEvery(saveDashlet().type, wrapSaga, { ...ea, saga: sagaSaveDashlet });
  yield takeEvery(initJournal().type, wrapSaga, { ...ea, saga: sagaInitJournal });

  yield takeEvery(reloadGrid().type, wrapSaga, { ...ea, saga: sagaReloadGrid });
  yield takeEvery(reloadTreeGrid().type, wrapSaga, { ...ea, saga: sagaReloadTreeGrid });

  yield takeEvery(deleteRecords().type, wrapSaga, { ...ea, saga: sagaDeleteRecords });
  yield takeEvery(saveRecords().type, wrapSaga, { ...ea, saga: sagaSaveRecords });

  yield takeEvery(saveJournalSetting().type, wrapSaga, { ...ea, saga: sagaSaveJournalSetting });
  yield takeEvery(createJournalSetting().type, wrapSaga, { ...ea, saga: sagaCreateJournalSetting });
  yield takeEvery(deleteJournalSetting().type, wrapSaga, { ...ea, saga: sagaDeleteJournalSetting });
  yield takeEvery(renameJournalSetting().type, wrapSaga, { ...ea, saga: sagaRenameJournalSetting });

  yield takeEvery(onJournalSettingsSelect().type, wrapSaga, { ...ea, saga: sagaOnJournalSettingsSelect });
  yield takeEvery(onJournalSelect().type, wrapSaga, { ...ea, saga: sagaOnJournalSelect });
  yield takeEvery(initJournalSettingData().type, wrapSaga, { ...ea, saga: sagaInitJournalSettingData });

  yield takeEvery(initPreview().type, wrapSaga, { ...ea, saga: sagaInitPreview });
  yield takeEvery(goToJournalsPage().type, wrapSaga, { ...ea, saga: sagaGoToJournalsPage });
  yield takeEvery(search().type, wrapSaga, { ...ea, saga: sagaSearch });
  yield takeEvery(performGroupAction().type, wrapSaga, { ...ea, saga: sagaPerformGroupAction });
  yield takeEvery(createZip().type, wrapSaga, { ...ea, saga: sagaCreateZip });
}

export default saga;
