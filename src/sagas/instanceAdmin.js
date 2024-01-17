import { takeEvery } from 'redux-saga';
import { call, put, select } from 'redux-saga/effects';

import { getJournalTabInfo, getMetaInfo, getActionsInfo, setJournalTabInfo, setMetaInfo, setActionsInfo } from '../actions/instanceAdmin';
import { selectInstanceTabInfo } from '../selectors/instanceAdmin';
import { SourcesId } from '../constants';
import RecordActionsApi from '../components/Records/actions/recordActionsApi';
import RecordActions from '../components/Records/actions/recordActions';

function* sagaGetMetaInfo({ api, logger }, { payload }) {
  try {
    const { instanceId } = payload;

    const metaInfo = yield call(api.instanceAdmin.getMetaInfo, instanceId);

    yield put(setMetaInfo({ instanceId, metaInfo }));
  } catch (e) {
    logger.error('[bpmnAdmin sagaGetMetaInfo saga] error', e);
  }
}

function* sagaGetJournalTabInfo({ api, logger }, { payload }) {
  try {
    const tabInfo = yield select(selectInstanceTabInfo, payload);

    const tabInfoResponse = yield call(api.instanceAdmin.getJournalTabInfo, { ...payload, ...tabInfo });

    yield put(setJournalTabInfo({ ...payload, ...tabInfo, data: tabInfoResponse.records, totalCount: tabInfoResponse.totalCount }));
  } catch (e) {
    logger.error('[bpmnAdmin sagaGetJournalTabInfo saga] error', e);
  }
}

function* sagaGetActionsInfo({ api, logger }, { payload }) {
  try {
    const { instanceId } = payload;

    const actionsIds = yield call(RecordActionsApi.getActionsByType, `${SourcesId.TYPE}@bpmn-process`);

    const actionsResponse = yield call(RecordActions.getActionsForRecords, [instanceId], actionsIds, {});

    if (!actionsResponse || !actionsResponse.forRecord) {
      return;
    }

    yield put(setActionsInfo({ instanceId, actions: actionsResponse.forRecord[instanceId] }));
  } catch (e) {
    logger.error('[bpmnAdmin sagaGetJournalTabInfo saga] error', e);
  }
}

function* saga(ea) {
  yield takeEvery(getMetaInfo().type, sagaGetMetaInfo, ea);
  yield takeEvery(getJournalTabInfo().type, sagaGetJournalTabInfo, ea);
  yield takeEvery(getActionsInfo().type, sagaGetActionsInfo, ea);
}

export default saga;
