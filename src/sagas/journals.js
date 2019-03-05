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
  setJournalConfig,
  deleteRecords,
  saveRecords,
  setSelectedRecords,
  setJournalsListName
} from '../actions/journals';
import { setLoading } from '../actions/loader';

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
    const config = yield call(api.journals.getDashletConfig, action.payload);

    if (config) {
      yield put(setEditorMode(false));
      yield put(setDashletConfig(config));

      const { journalsListId, journalId } = config;
      const journalsList = yield getJournalsList(api);
      const journalListName = (journalsList.filter(journalList => journalList.id === journalsListId)[0] || {}).title || '';

      yield getJournals(api, journalsListId);

      yield put(setJournalsListName(journalListName));
      yield put(reloadGrid({ journalId }));
    } else {
      yield put(setEditorMode(true));
    }
  } catch (e) {
    logger.error('[journals fetchDashletConfig saga error', e.message);
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
    yield put(setLoading(true));

    /*get config from arguments or from state*/
    let journalConfig = yield select(state => state.journals.journalConfig || {});
    let {
      journalId,
      pagination = yield select(state => state.journals.pagination),
      columns = journalConfig.columns,
      criteria = (journalConfig.meta || {}).criteria
    } = action.payload;

    /*or load from server*/
    if (journalId) {
      journalConfig = yield call(api.journals.getJournalConfig, journalId);
      columns = journalConfig.columns;
      criteria = journalConfig.meta.criteria;
      yield put(setJournalConfig(journalConfig));
    }

    const gridData = yield call(api.journals.getGridData, { columns, criteria, pagination });
    yield put(setGrid(gridData));

    yield put(setLoading(false));
  } catch (e) {
    logger.error('[journals loadGrid saga error', e.message);
  }
}

function* removeRecords({ api, logger }, action) {
  try {
    yield put(setLoading(true));
    yield call(api.journals.deleteRecords, action.payload);
    yield put(setLoading(false));

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
    yield put(setLoading(true));
    yield call(api.journals.saveRecords, action.payload);
    yield put(setLoading(false));

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
