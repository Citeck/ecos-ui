import { takeEvery } from 'redux-saga';
import { call, put, select } from 'redux-saga/effects';

import { getProcesses, setProcesses, setTotalCount } from '../actions/bpmnAdmin';
import { selectBpmnAdminFilter, selectBpmnAdminPage } from '../selectors/bpmnAdmin';

function* sagaGetProcesses({ api, logger }, { payload }) {
  try {
    const allRecords = payload && payload.allRecords;
    const page = yield select(selectBpmnAdminPage);
    const filterPredicate = yield select(selectBpmnAdminFilter);
    const processes = yield call(api.bpmnAdmin.getProcesses, { page: allRecords ? { maxItems: 10000 } : page, filterPredicate });

    yield put(setProcesses(processes.records));
    yield put(setTotalCount(processes.totalCount));
  } catch (e) {
    logger.error('[bpmnAdmin doGetProcesses saga] error', e);
  }
}

function* saga(ea) {
  yield takeEvery(getProcesses().type, sagaGetProcesses, ea);
}

export default saga;
