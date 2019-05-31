import { put, takeLatest, call, select } from 'redux-saga/effects';
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
  onJournalSettingsSelect,
  onJournalSelect,
  initPreview,
  setPreviewUrl
} from '../actions/journals';
import { setLoading } from '../actions/loader';

const getDefaultSortBy = config => {
  const params = config.params || {};
  // eslint-disable-next-line
  const defaultSortBy = params.defaultSortBy ? eval('(' + params.defaultSortBy + ')') : [];

  return defaultSortBy.map(item => ({
    attribute: item.id,
    ascending: item.order !== 'desc'
  }));
};

function* sagaGetDashletEditorData({ api, logger }, action) {
  try {
    const config = action.payload || {};
    yield getJournalsList(api);
    yield getJournals(api, config.journalsListId);
    yield getJournalSettings(api, config.journalType);
  } catch (e) {
    logger.error('[journals sagaGetDashletEditorData saga error', e.message);
  }
}

function* sagaGetDashletConfig({ api, logger }, action) {
  try {
    const config = yield call(api.journals.getDashletConfig, action.payload);

    if (config) {
      yield put(setEditorMode(false));
      yield put(setDashletConfig(config));

      const { journalsListId, journalId, journalSettingId = '' } = config;
      yield getJournals(api, journalsListId);

      yield put(initJournal({ journalId, journalSettingId }));
    } else {
      yield put(setEditorMode(true));
    }
  } catch (e) {
    logger.error('[journals sagaGetDashletConfig saga error', e.message);
  }
}

function* sagaGetJournalsData({ api, logger }, action) {
  try {
    const { journalsListId, journalId, journalSettingId = '' } = action.payload;
    yield getJournals(api, journalsListId);

    yield put(initJournal({ journalId, journalSettingId }));
  } catch (e) {
    logger.error('[journals sagaGetDashletConfig saga error', e.message);
  }
}

function* getJournalsList(api) {
  const journalsList = yield call(api.journals.getJournalsList);
  yield put(setJournalsList(journalsList));
  return journalsList;
}

function* getJournals(api, journalsListId) {
  const journals = journalsListId
    ? yield call(api.journals.getJournalsByJournalsList, journalsListId)
    : yield call(api.journals.getJournals);
  yield put(setJournals(journals));
}

function* getJournalSettings(api, journalId) {
  const settings = yield call(api.journals.getJournalSettings, journalId);
  yield put(setJournalSettings(settings));
}

function* getJournalConfig(api, journalId) {
  let journalConfig = yield call(api.journals.getJournalConfig, journalId);
  yield put(setJournalConfig(journalConfig));
  return journalConfig;
}

function* getGridParams(journalConfig, journalSetting) {
  const {
    meta: { createVariants, predicate }
  } = journalConfig;
  const { sortBy, groupBy, columns, predicate: journalSettingPredicate } = journalSetting;
  const params = {
    createVariants,
    predicate,
    sortBy: sortBy.map(sort => ({ ...sort })),
    columns: columns.map(col => ({ ...col })),
    groupBy: Array.from(groupBy),
    predicates: journalSettingPredicate ? [{ ...journalSettingPredicate }] : []
  };

  let pagination = yield select(state => state.journals.grid.pagination);
  params.pagination = params.groupBy && params.groupBy.length ? { ...pagination, maxItems: undefined } : pagination;

  return params;
}

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
    predicate: null
  };
}

function* getJournalSetting(api, journalSettingId, journalConfig) {
  let journalSetting;

  journalSettingId = journalSettingId || journalConfig.journalSettingId;

  if (journalSettingId) {
    journalSetting = yield call(api.journals.getJournalSetting, journalSettingId);
  }

  if (!journalSetting) {
    journalSettingId = '';
    journalSetting = getDefaultJournalSetting(journalConfig);
  }

  yield put(setJournalSetting({ ...journalSetting, fileId: journalSettingId }));

  yield put(setPredicate(journalSetting.predicate));
  yield put(
    setColumnsSetup({
      columns: journalSetting.groupBy.length ? journalConfig.columns : journalSetting.columns,
      sortBy: journalSetting.sortBy
    })
  );
  yield put(
    setGrouping({
      columns: journalSetting.groupBy.length ? journalSetting.columns : [],
      groupBy: journalSetting.groupBy
    })
  );

  return journalSetting;
}

function* loadGrid(api, journalSettingId, journalConfig) {
  let journalSetting = yield getJournalSetting(api, journalSettingId, journalConfig);
  let params = yield getGridParams(journalConfig, journalSetting);

  const gridData = yield call(api.journals.getGridData, params);

  yield put(setGrid({ ...params, ...gridData }));
}

function* sagaReloadGrid({ api, logger }, action) {
  try {
    yield put(setLoading(true));

    const { columns } = yield select(state => state.journals.journalConfig);
    const grid = yield select(state => state.journals.grid);

    grid.columns = columns;

    let params = {
      ...grid,
      ...(action.payload || {})
    };

    const gridData = yield call(api.journals.getGridData, params);

    yield put(setGrid({ ...params, ...gridData }));

    yield put(setLoading(false));
  } catch (e) {
    logger.error('[journals sagaReloadGrid saga error', e.message);
  }
}

function* sagaReloadTreeGrid({ api, logger }, action) {
  try {
    yield put(setLoading(true));

    const gridData = yield call(api.journals.getTreeGridData);
    yield put(setGrid(gridData));

    yield put(setLoading(false));
  } catch (e) {
    logger.error('[journals sagaReloadTreeGrid saga error', e.message);
  }
}

function* sagaSaveDashlet({ api, logger }, action) {
  try {
    const { id, config } = action.payload;
    yield call(api.journals.saveDashletConfig, config, id);
    yield put(getDashletConfig(id));
  } catch (e) {
    logger.error('[journals sagaSaveDashlet saga error', e.message);
  }
}

function* sagaInitJournal({ api, logger }, action) {
  try {
    yield put(setLoading(true));

    let { journalId, journalSettingId } = action.payload;

    const journalConfig = yield getJournalConfig(api, journalId);
    yield getJournalSettings(api, journalConfig.id);
    yield loadGrid(api, journalSettingId, journalConfig);

    yield put(setLoading(false));
  } catch (e) {
    yield put(setLoading(false));
    logger.error('[journals sagaInitJournal saga error', e.message);
  }
}

function* sagaOnJournalSettingsSelect({ api, logger }, action) {
  try {
    yield put(setLoading(true));

    let journalSettingId = action.payload;
    let journalConfig = yield select(state => state.journals.journalConfig);

    yield loadGrid(api, journalSettingId, journalConfig);

    yield put(setLoading(false));
  } catch (e) {
    logger.error('[journals sagaOnJournalSettingsSelect saga error', e.message);
  }
}

function* sagaOnJournalSelect({ api, logger }, action) {
  try {
    yield put(setLoading(true));

    let journalId = action.payload;
    const journalConfig = yield getJournalConfig(api, journalId);

    yield getJournalSettings(api, journalConfig.id);
    yield loadGrid(api, null, journalConfig);

    yield put(setLoading(false));
  } catch (e) {
    logger.error('[journals sagaOnJournalSelect saga error', e.message);
  }
}

function* sagaDeleteRecords({ api, logger }, action) {
  try {
    yield put(setLoading(true));
    yield call(api.journals.deleteRecords, action.payload);
    yield put(setLoading(false));

    yield put(reloadGrid());
    yield put(setSelectedRecords([]));
  } catch (e) {
    logger.error('[journals sagaDeleteRecords saga error', e.message);
  }
}

function* sagaSaveRecords({ api, logger }, action) {
  try {
    yield put(setLoading(true));
    yield call(api.journals.saveRecords, action.payload);
    yield put(setLoading(false));

    yield put(reloadGrid());
  } catch (e) {
    logger.error('[journals sagaSaveRecords saga error', e.message);
  }
}

function* sagaSaveJournalSetting({ api, logger }, action) {
  try {
    yield call(api.journals.saveJournalSetting, action.payload);
  } catch (e) {
    logger.error('[journals sagaSaveJournalSetting saga error', e.message);
  }
}

function* sagaCreateJournalSetting({ api, logger }, action) {
  try {
    const journalSettingId = yield call(api.journals.createJournalSetting, action.payload);

    let journalConfig = yield select(state => state.journals.journalConfig);
    yield getJournalSettings(api, journalConfig.id);
    yield loadGrid(api, journalSettingId, journalConfig);
  } catch (e) {
    logger.error('[journals sagaCreateJournalSetting saga error', e.message);
  }
}

function* sagaDeleteJournalSetting({ api, logger }, action) {
  try {
    yield call(api.journals.deleteJournalSetting, action.payload);
  } catch (e) {
    logger.error('[journals sagaCreateJournalSetting saga error', e.message);
  }
}

function* sagaInitPreview({ api, logger }, action) {
  try {
    const nodeRef = action.payload;
    const previewUrl = yield call(api.journals.getPreviewUrl, nodeRef);

    yield put(setPreviewUrl(previewUrl));
  } catch (e) {
    logger.error('[journals sagaInitPreview saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDashletConfig().type, sagaGetDashletConfig, ea);
  yield takeLatest(getDashletEditorData().type, sagaGetDashletEditorData, ea);
  yield takeLatest(getJournalsData().type, sagaGetJournalsData, ea);
  yield takeLatest(saveDashlet().type, sagaSaveDashlet, ea);
  yield takeLatest(initJournal().type, sagaInitJournal, ea);

  yield takeLatest(reloadGrid().type, sagaReloadGrid, ea);
  yield takeLatest(reloadTreeGrid().type, sagaReloadTreeGrid, ea);

  yield takeLatest(deleteRecords().type, sagaDeleteRecords, ea);
  yield takeLatest(saveRecords().type, sagaSaveRecords, ea);

  yield takeLatest(saveJournalSetting().type, sagaSaveJournalSetting, ea);
  yield takeLatest(createJournalSetting().type, sagaCreateJournalSetting, ea);
  yield takeLatest(deleteJournalSetting().type, sagaDeleteJournalSetting, ea);

  yield takeLatest(onJournalSettingsSelect().type, sagaOnJournalSettingsSelect, ea);
  yield takeLatest(onJournalSelect().type, sagaOnJournalSelect, ea);

  yield takeLatest(initPreview().type, sagaInitPreview, ea);
}

export default saga;
