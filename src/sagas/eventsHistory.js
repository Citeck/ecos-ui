import { call, put, takeEvery, select } from 'redux-saga/effects';
import { getEventsHistory, getJournalHistory, setEventsHistory, filterJournalHistory } from '../actions/eventsHistory';
import { selectDataEventsHistoryByStateId } from '../selectors/eventsHistory';
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

function* sagaGetJournalHistory({ logger }, { payload }) {
  const { record, stateId, selectedJournal } = payload;

  try {
    const journalConfig = yield call(
      [JournalsService, JournalsService.getJournalConfig],
      selectedJournal || EventsHistoryService.defaultJournal,
      true
    );

    const res = yield call([JournalsService, JournalsService.getJournalData], journalConfig, {
      predicate: { att: 'document', val: [record], t: PREDICATE_CONTAINS }
    });

    yield put(setEventsHistory({ stateId, list: res.records || [], columns: journalConfig.columns, journalConfig }));
  } catch (e) {
    yield put(setEventsHistory({ stateId, list: [], columns: [] }));
    logger.error('[eventHistory sagaGetJournalHistory saga] error', e.message);
  }
}

function* sagaFilterJournalHistory({ logger }, { payload }) {
  const { record, stateId, predicates } = payload;

  try {
    const { journalConfig } = yield select(state => selectDataEventsHistoryByStateId(state, stateId) || {});
    const settings = JournalsConverter.getSettingsForDataLoaderServer({
      predicate: { att: 'document', val: [record], t: PREDICATE_CONTAINS },
      predicates
    });
    const res = yield call([JournalsService, JournalsService.getJournalData], journalConfig, settings);

    yield put(setEventsHistory({ stateId, list: res.records || [] }));
  } catch (e) {
    yield put(setEventsHistory({ stateId, list: [] }));
    logger.error('[eventHistory sagaFilterJournalHistory saga] error', e.message);
  }
}

function* eventsHistorySaga(ea) {
  yield takeEvery(getEventsHistory().type, sagaGetEventsHistory, ea);
  yield takeEvery(getJournalHistory().type, sagaGetJournalHistory, ea);
  yield takeEvery(filterJournalHistory().type, sagaFilterJournalHistory, ea);
}

export default eventsHistorySaga;
