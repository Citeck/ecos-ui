import { put, takeLatest, call, select } from 'redux-saga/effects';
import {
  getDashletEditorData,
  getDashletConfig,
  saveDashlet,
  setGrid,
  setEditorMode,
  setJournalsList,
  setJournals,
  setDashletConfig,
  reloadGrid,
  initGrid,
  reloadTreeGrid,
  setJournalConfig,
  deleteRecords,
  saveRecords,
  setSelectedRecords,
  saveJournalSettings
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

      const { journalsListId, journalId } = config;
      yield getJournals(api, journalsListId);

      yield put(initGrid(journalId));
    } else {
      yield put(setEditorMode(true));
    }
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

function* sagaSaveDashlet({ api, logger }, action) {
  try {
    const { id, config } = action.payload;
    yield call(api.journals.saveDashletConfig, config, id);
    yield put(getDashletConfig(id));
  } catch (e) {
    logger.error('[journals sagaSaveDashlet saga error', e.message);
  }
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

function* sagaInitGrid({ api, logger }, action) {
  try {
    yield put(setLoading(true));

    let config = yield call(api.journals.getJournalConfig, action.payload);
    yield put(setJournalConfig(config));

    const {
      columns,
      meta: { criteria, createVariants, predicate, groupBy }
    } = config;
    let pagination = yield select(state => state.journals.grid.pagination);

    const params = {
      columns,
      criteria,
      pagination: groupBy ? { ...pagination, maxItems: undefined } : pagination,
      createVariants,
      predicate,
      groupBy,
      sortBy: getDefaultSortBy(config)
    };

    const gridData = yield call(api.journals.getGridData, params);

    yield put(setGrid({ ...params, ...gridData }));

    yield put(setLoading(false));
  } catch (e) {
    logger.error('[journals sagaInitGrid saga error', e.message);
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

function* sagaSaveJournalSettings({ api, logger }, action) {
  try {
    yield call(api.journals.saveJournalSettings, action.payload);
  } catch (e) {
    logger.error('[journals sagaSaveJournalSettings saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDashletConfig().type, sagaGetDashletConfig, ea);
  yield takeLatest(getDashletEditorData().type, sagaGetDashletEditorData, ea);
  yield takeLatest(saveDashlet().type, sagaSaveDashlet, ea);
  yield takeLatest(reloadGrid().type, sagaReloadGrid, ea);
  yield takeLatest(initGrid().type, sagaInitGrid, ea);
  yield takeLatest(reloadTreeGrid().type, sagaReloadTreeGrid, ea);
  yield takeLatest(deleteRecords().type, sagaDeleteRecords, ea);
  yield takeLatest(saveRecords().type, sagaSaveRecords, ea);
  yield takeLatest(saveJournalSettings().type, sagaSaveJournalSettings, ea);
}

export default saga;
