import { call, put, select, takeEvery } from 'redux-saga/effects';

import { filterHeatdata, filterJournal, getJournal, getModel, setJournal, setModel } from '../actions/processStatistics';
import JournalsService from '../components/Journals/service/journalsService';
import JournalsConverter from '../dto/journals';
import { PREDICATE_EQ } from '../components/Records/predicates/predicates';

const getSettings = ({ pagination, predicates, record }) => {
  return JournalsConverter.getSettingsForDataLoaderServer({
    predicate: { att: 'procDefRef', val: record, t: PREDICATE_EQ },
    predicates,
    pagination
  });
};

function* sagaGetJournal({ api, logger }, { payload }) {
  const { record, stateId, pagination, selectedJournal } = payload;

  try {
    const journalConfig = yield call([JournalsService, JournalsService.getJournalConfig], selectedJournal, true);
    const res = yield call([JournalsService, JournalsService.getJournalData], journalConfig, getSettings({ pagination, record }));

    yield put(setJournal({ stateId, data: res.records, journalConfig, totalCount: res.totalCount }));
  } catch (e) {
    yield put(setJournal({ stateId, data: [], journalConfig: null }));
    logger.error('[processStatistics/sagaGetJournal] error', e);
  }
}

function* sagaFilterJournal({ api, logger }, { payload }) {
  const { record, stateId, pagination, predicates } = payload;

  try {
    yield put(filterHeatdata({ record, stateId, predicates }));

    const journalConfig = yield select(state => state.processStatistics[stateId].journalConfig);
    const res = yield call(
      [JournalsService, JournalsService.getJournalData],
      journalConfig,
      getSettings({ pagination, record, predicates })
    );

    yield put(setJournal({ stateId, data: res.records, totalCount: res.totalCount }));
  } catch (e) {
    yield put(setJournal({ stateId, data: [], journalConfig: null }));
    logger.error('[processStatistics/sagaFilterJournal] error', e);
  }
}

function* sagaGetModel({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    const model = yield call(api.cmmn.getModel, record);
    const heatmapData = yield call(api.cmmn.getHeatmapData, record);

    yield put(setModel({ stateId, model, heatmapData }));
  } catch (e) {
    yield put(setModel({ stateId, model: null, heatmapData: [] }));
    logger.error('[processStatistics/sagaGetModel] error', e);
  }
}

function* sagaFilterHeatdata({ api, logger }, { payload }) {
  const { record, stateId, predicates } = payload;

  try {
    const heatmapData = yield call(api.cmmn.getHeatmapData, record, predicates);
    yield put(setModel({ stateId, heatmapData }));
  } catch (e) {
    yield put(setModel({ stateId, heatmapData: [] }));
    logger.error('[processStatistics/sagaFilterHeatdata] error', e);
  }
}

function* eventsHistorySaga(ea) {
  yield takeEvery(getModel().type, sagaGetModel, ea);
  yield takeEvery(getJournal().type, sagaGetJournal, ea);
  yield takeEvery(filterJournal().type, sagaFilterJournal, ea);
  yield takeEvery(filterHeatdata().type, sagaFilterHeatdata, ea);
}

export default eventsHistorySaga;
