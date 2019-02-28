import { put, takeLatest, call, select } from 'redux-saga/effects';
import {
  getDashletEditorData,
  getDashletConfig,
  setDashletIsReady,
  saveDashlet,
  setGrid,
  setDashletEditorVisible,
  setJournalsList,
  setJournals,
  setDashletConfig,
  reloadGrid,
  setJournalConfig,
  deleteRecords,
  saveRecords,
  setSelectedRecords
} from '../actions/journals';

function* getJournalsList(api) {
  const journalsList = yield call(api.journals.getJournalsList);
  yield put(setJournalsList(journalsList));
}

function* getJournals(api, journalsListId) {
  const journals = journalsListId
    ? yield call(api.journals.getJournalsByJournalsList, journalsListId)
    : yield call(api.journals.getJournals);
  yield put(setJournals(journals));
}

function* putDashlet({ api, logger }, action) {
  try {
    const { id, config } = action.payload;

    yield call(api.journals.saveDashletConfig, config, id);
    yield put(getDashletConfig(id));
  } catch (e) {
    logger.error('[journals putDashlet saga error', e.message);
  }
}

function* loadGrid({ api, logger }, action) {
  try {
    let { journalId, pagination = yield select(state => state.journals.pagination), columns, criteria } = action.payload;

    if (journalId) {
      const journalConfig = yield call(api.journals.getJournalConfig, journalId);
      yield put(setJournalConfig(journalConfig));

      columns = journalConfig.columns;
      criteria = journalConfig.meta.criteria;
    }

    const gridData = yield call(api.journals.getGridData, { columns, criteria, pagination });

    yield put(setGrid(gridData));
  } catch (e) {
    logger.error('[journals loadGrid saga error', e.message);
  }
}

function* fetchDashletEditorData({ api, logger }, action) {
  try {
    const config = action.payload || {};
    yield getJournalsList(api);
    yield getJournals(api, config.journalsListId);
  } catch (e) {
    logger.error('[journals fetchDashletEditorData saga error', e.message);
  }
}

function* fetchDashletConfig({ api, logger }, action) {
  try {
    yield put(setDashletIsReady(false));
    const config = yield call(api.journals.getDashletConfig, action.payload);

    if (config) {
      const { journalsListId, journalId } = config;

      yield getJournalsList(api);
      yield getJournals(api, journalsListId);

      yield put(reloadGrid({ journalId }));
      yield put(setDashletConfig(config));
      yield put(setDashletEditorVisible(false));
    }

    yield put(setDashletIsReady(true));
  } catch (e) {
    yield put(setDashletIsReady(true));
    logger.error('[journals fetchDashletConfig saga error', e.message);
  }
}

function* removeRecords({ api, logger }, action) {
  try {
    yield call(api.journals.deleteRecords, action.payload);

    const {
      columns,
      meta: { criteria }
    } = yield select(state => state.journals.journalConfig);
    yield put(reloadGrid({ columns, criteria }));

    yield put(setSelectedRecords([]));
  } catch (e) {
    logger.error('[journals removeRecords saga error', e.message);
  }
}

function* updateRecords({ api, logger }, action) {
  try {
    yield call(api.journals.saveRecords, action.payload);

    const {
      columns,
      meta: { criteria }
    } = yield select(state => state.journals.journalConfig);
    yield put(reloadGrid({ columns, criteria }));
  } catch (e) {
    logger.error('[journals updateRecords saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDashletConfig().type, fetchDashletConfig, ea);
  yield takeLatest(getDashletEditorData().type, fetchDashletEditorData, ea);
  yield takeLatest(saveDashlet().type, putDashlet, ea);
  yield takeLatest(reloadGrid().type, loadGrid, ea);
  yield takeLatest(deleteRecords().type, removeRecords, ea);
  yield takeLatest(saveRecords().type, updateRecords, ea);
}

export default saga;
