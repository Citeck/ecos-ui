import { call, put, takeEvery } from 'redux-saga/effects';
import { getEventsHistory, getJournalHistory, setEventsHistory, filterJournalHistory } from '../actions/eventsHistory';
import JournalsService from '../components/Journals/service/journalsService';
import JournalsConverter from '../dto/journals';
import { PREDICATE_CONTAINS } from '../components/Records/predicates/predicates';
import EventsHistoryService from '../services/eventsHistory';

/**
 * @deprecated
 */
function* sagaGetEventsHistory({ api, logger }, { payload }) {
  const { record, stateId, columns } = payload;

  try {
    const res = yield call(api.eventsHistory.getEventsHistory, { record, columns });

    yield put(setEventsHistory({ stateId, list: res.data || [], columns: res.columns || [] }));
  } catch (e) {
    yield put(setEventsHistory({ stateId, list: [], columns: [] }));
    logger.error('[eventHistory sagaGetEventsHistory saga] error', e.message);
  }
}

function* sagaGetJournalHistory({ api, logger }, { payload }) {
  const { record, stateId, selectedJournal } = payload;

  try {
    const jConfig = yield call(
      [JournalsService, JournalsService.getJournalConfig],
      selectedJournal || EventsHistoryService.defaultJournal,
      true
    );
    const res = yield call([JournalsService, JournalsService.getJournalData], jConfig, {
      predicate: { att: 'document', val: [record], t: PREDICATE_CONTAINS }
    });

    yield put(setEventsHistory({ stateId, list: res.records || [], columns: jConfig.columns }));
  } catch (e) {
    yield put(setEventsHistory({ stateId, list: [], columns: [] }));
    logger.error('[eventHistory sagaGetJournalHistory saga] error', e.message);
  }
}

function* sagaFilterJournalHistory({ api, logger }, { payload }) {
  const { record, stateId, selectedJournal, predicates } = payload;

  try {
    const jConfig = yield call(
      [JournalsService, JournalsService.getJournalConfig],
      selectedJournal || EventsHistoryService.defaultJournal,
      true
    );

    const settings = JournalsConverter.getSettingsForDataLoaderServer({
      predicate: { att: 'document', val: [record], t: PREDICATE_CONTAINS },
      predicates
    });
    const res = yield call([JournalsService, JournalsService.getJournalData], jConfig, settings);

    yield put(setEventsHistory({ stateId, list: res.records || [], columns: jConfig.columns }));
  } catch (e) {
    yield put(setEventsHistory({ stateId, list: [], columns: [] }));
    logger.error('[eventHistory sagaFilterJournalHistory saga] error', e.message);
  }
}

function* eventsHistorySaga(ea) {
  yield takeEvery(getEventsHistory().type, sagaGetEventsHistory, ea);
  yield takeEvery(getJournalHistory().type, sagaGetJournalHistory, ea);
  yield takeEvery(filterJournalHistory().type, sagaFilterJournalHistory, ea);
}

export default eventsHistorySaga;
