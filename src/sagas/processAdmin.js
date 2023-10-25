import { takeEvery } from 'redux-saga';
import { call, put, select } from 'redux-saga/effects';

import { getMetaInfo, setMetaInfo, getAllVersions, setAllVersions, getJournalTabInfo, setJournalTabInfo } from '../actions/processAdmin';
import { selectProcessTabInfo } from '../selectors/processAdmin';

function* sagaGetMetaInfo({ api, logger }, { payload }) {
  try {
    const { processId } = payload;

    const metaInfo = yield call(api.processAdmin.getMetaInfo, processId);

    yield put(setMetaInfo({ processId, metaInfo }));
  } catch (e) {
    logger.error('[bpmnAdmin sagaGetMetaInfo saga] error', e);
  }
}

function* sagaGetAllVersions({ api, logger }, { payload }) {
  try {
    const { processId, processKey } = payload;

    const versionsResponse = yield call(api.processAdmin.getProcessVersions, processKey);

    yield put(setAllVersions({ processId, versions: versionsResponse.records }));
  } catch (e) {
    logger.error('[bpmnAdmin sagaGetAllVersions saga] error', e);
  }
}

function* sagaGetJournalTabInfo({ api, logger }, { payload }) {
  try {
    const tabInfo = yield select(selectProcessTabInfo, payload);

    const tabInfoResponse = yield call(api.processAdmin.getJournalTabInfo, { ...tabInfo, ...payload });

    yield put(setJournalTabInfo({ ...tabInfo, ...payload, data: tabInfoResponse.records, totalCount: tabInfoResponse.totalCount }));
  } catch (e) {
    logger.error('[bpmnAdmin sagaGetJournalTabInfo saga] error', e);
  }
}

function* saga(ea) {
  yield takeEvery(getMetaInfo().type, sagaGetMetaInfo, ea);
  yield takeEvery(getAllVersions().type, sagaGetAllVersions, ea);
  yield takeEvery(getJournalTabInfo().type, sagaGetJournalTabInfo, ea);
}

export default saga;
