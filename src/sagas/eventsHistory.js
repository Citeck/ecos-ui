import { call, put, select, takeEvery } from 'redux-saga/effects';
import { filterEventsHistory, getEventsHistory, setEventsHistory } from '../actions/eventsHistory';
import { selectListEventsHistory } from '../selectors/eventsHistory';
import JournalsService from '../components/Journals/service/journalsService';
import EventsHistoryService from '../services/eventsHistory';
import { PREDICATE_CONTAINS } from '../components/Records/predicates/predicates';

function* sagaGetEventsHistory({ api, logger }, { payload }) {
  const { record, stateId, columns, selectedJournal } = payload;

  try {
    let jConfig = EventsHistoryService.config;

    if (selectedJournal) {
      jConfig = yield call([JournalsService, JournalsService.getJournalConfig], selectedJournal, true);
    } else {
      jConfig.columns = yield call([JournalsService, JournalsService.resolveColumns], columns);
    }

    const res = yield call([JournalsService, JournalsService.getJournalData], jConfig, {
      predicate: { att: 'document', val: [record], t: PREDICATE_CONTAINS }
    });

    yield put(setEventsHistory({ stateId, list: res.records || [], columns: jConfig.columns }));
  } catch (e) {
    yield put(setEventsHistory({ stateId, list: [], columns: [] }));
    logger.error('[eventHistory sagaGetEventsHistory saga] error', e.message);
  }
}

function* sagaFilterEventsHistory({ api, logger }, { payload }) {
  // todo for server filer record, predicates
  const { stateId, columns } = payload;
  const list = yield select(selectListEventsHistory, stateId);

  try {
    yield put(setEventsHistory({ stateId, list, columns }));
  } catch (e) {
    yield put(setEventsHistory({ stateId, list: [], columns: [] }));
    logger.error('[eventHistory sagaFilterEventsHistory saga] error', e.message);
  }
}

function* eventsHistorySaga(ea) {
  yield takeEvery(getEventsHistory().type, sagaGetEventsHistory, ea);
  yield takeEvery(filterEventsHistory().type, sagaFilterEventsHistory, ea);
}

export default eventsHistorySaga;
