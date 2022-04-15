import { call, put, takeEvery } from 'redux-saga/effects';

import { getJournal, getModel, setJournal, setModel } from '../actions/processStatistics';
import JournalsService from '../components/Journals/service/journalsService';
import { PREDICATE_CONTAINS } from '../components/Records/predicates/predicates';
import JournalsConverter from '../dto/journals';
//import Records from '../components/Records';
//import { SourcesId } from '../constants';

const getSettings = ({ predicates, record }) => {
  return JournalsConverter.getSettingsForDataLoaderServer({
    predicate: { att: 'document', val: [record], t: PREDICATE_CONTAINS },
    predicates
  });
};

function* sagaGetJournal({ api, logger }, { payload }) {
  const { record, stateId, selectedJournal } = payload;

  try {
    const journalConfig = yield call([JournalsService, JournalsService.getJournalConfig], selectedJournal, true);
    const res = yield call([JournalsService, JournalsService.getJournalData], journalConfig);

    yield put(setJournal({ stateId, data: res.records, journalConfig }));
  } catch (e) {
    yield put(setJournal({ stateId, data: [], journalConfig: null }));
    logger.error('[processStatistics/sagaGetJournal] error', e);
  }
}

function* sagaGetModel({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    //todo ???
    // const process = () => Records.get(record).load('ecosbpm:processId')
    // const processId = yield call(process);
    // console.log(SourcesId.BPMN_DEF+'@'+processId)
    const model = yield call(api.cmmn.getDefinition, 'eproc/bpmn-def@bpmn-test');
    //
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
