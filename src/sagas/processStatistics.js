import { call, put, takeEvery } from 'redux-saga/effects';

import { getJournal, getModel, setJournal, setModel } from '../actions/processStatistics';
import JournalsService from '../components/Journals/service/journalsService';
import { PREDICATE_CONTAINS } from '../components/Records/predicates/predicates';
import JournalsConverter from '../dto/journals';

const getSettings = ({ predicates, record }) => {
  return JournalsConverter.getSettingsForDataLoaderServer({
    predicate: { att: 'document', val: [record], t: PREDICATE_CONTAINS },
    predicates
  });
};

function* sagaGetJournal({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    const journalConfig = yield call([JournalsService, JournalsService.getJournalConfig], 'ecos-forms', true);

    const res = yield call([JournalsService, JournalsService.getJournalData], journalConfig, getSettings({ record }));
    yield put(setJournal({ stateId, ...res }));
  } catch (e) {
    yield put(setJournal({ stateId, data: [], columns: [] }));
    logger.error('[processStatistics/sagaGetJournal] error', e);
  }
}

function* sagaGetModel({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    const model = yield call(api.cmmn.getDefinition, record);

    yield put(setModel({ stateId, model }));
  } catch (e) {
    yield put(setModel({ stateId, model: null }));
    logger.error('[processStatistics/sagaGetModel] error', e);
  }
}

function* eventsHistorySaga(ea) {
  yield takeEvery(getModel().type, sagaGetModel, ea);
  yield takeEvery(getJournal().type, sagaGetJournal, ea);
  // yield takeEvery(getJournal().type, sagaFilterEventsHistory, ea);
}

export default eventsHistorySaga;
