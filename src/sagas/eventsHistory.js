import { call, put, select, takeEvery } from 'redux-saga/effects';
import { filterEventsHistory, getEventsHistory, getJournalHistory, setEventsHistory } from '../actions/eventsHistory';
import { selectListEventsHistory } from '../selectors/eventsHistory';
import JournalsService from '../components/Journals/service/journalsService';
import { PREDICATE_CONTAINS } from '../components/Records/predicates/predicates';

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
