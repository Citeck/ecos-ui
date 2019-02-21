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

function* getGridData(api, journalConfig, pagination) {
  const gridData = yield call(api.journals.getGridData, { ...journalConfig, pagination });
  yield put(setGrid(gridData));
}

function* putDashlet({ api, logger }, action) {
  try {
    const id = action.payload.id;
    const config = action.payload.config;

    yield call(api.journals.saveDashletConfig, config, id);
    yield put(getDashletConfig(id));
  } catch (e) {
    logger.error('[journals putDashlet saga error', e.message);
  }
}

function* loadGrid({ api, logger }, action) {
  try {
    const journalId = action.payload.journalId;
    const pagination = action.payload.pagination;

    if (journalId) {
      const journalConfig = yield call(api.journals.getJournalConfig, journalId);
      yield put(setJournalConfig(journalConfig));

      yield getGridData(api, journalConfig, pagination);
    }
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

    const id = action.payload;
    const config = yield call(api.journals.getDashletConfig, id);

    if (config) {
      yield getJournalsList(api);
      yield getJournals(api, config.journalsListId);
      yield put(reloadGrid({ journalId: config.journalId }));
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
    const records = action.payload;

    yield call(api.journals.deleteRecords, records);

    let journalConfig = yield select(state => state.journals.journalConfig);
    yield getGridData(api, journalConfig);
    yield put(setSelectedRecords([]));
  } catch (e) {
    logger.error('[journals removeRecords saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDashletConfig().type, fetchDashletConfig, ea);
  yield takeLatest(getDashletEditorData().type, fetchDashletEditorData, ea);
  yield takeLatest(saveDashlet().type, putDashlet, ea);
  yield takeLatest(reloadGrid().type, loadGrid, ea);
  yield takeLatest(deleteRecords().type, removeRecords, ea);
}

export default saga;
