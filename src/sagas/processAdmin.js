import { takeEvery } from 'redux-saga';
import { call, put, select } from 'redux-saga/effects';

import {
  getMetaInfo,
  setMetaInfo,
  getAllVersions,
  setAllVersions,
  getJournalTabInfo,
  setJournalTabInfo,
  getActionsInfo,
  setActionsInfo
} from '../actions/processAdmin';
import { selectProcessTabInfo } from '../selectors/processAdmin';
import RecordActionsApi from '../components/Records/actions/recordActionsApi';
import RecordActions from '../components/Records/actions/recordActions';
import { SourcesId } from '../constants';

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

function* sagaGetActionsInfo({ api, logger }, { payload }) {
  try {
    const { processId } = payload;

    const actionsIds = yield call(RecordActionsApi.getActionsByType, `${SourcesId.TYPE}@bpmn-def-engine`);

    const actionsResponse = yield call(RecordActions.getActionsForRecords, [processId], actionsIds, {});

    if (!actionsResponse || !actionsResponse.forRecord) {
      return;
    }

    yield put(setActionsInfo({ processId, actions: actionsResponse.forRecord[processId] }));
  } catch (e) {
    logger.error('[bpmnAdmin sagaGetJournalTabInfo saga] error', e);
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
  yield takeEvery(getActionsInfo().type, sagaGetActionsInfo, ea);
  yield takeEvery(getJournalTabInfo().type, sagaGetJournalTabInfo, ea);
}

export default saga;
