import { get, head } from 'lodash';
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';

import {
  changeDocStatus,
  getAvailableToChangeStatuses,
  getDocStatus,
  initDocStatus,
  setAvailableToChangeStatuses,
  setChangeResult,
  setDocStatus
} from '../actions/docStatus';
import Records from '../components/Records/Records';
import { EVENTS } from '../components/widgets/BaseWidget';
import DocStatusConverter from '../dto/docStatus';
import { t } from '../helpers/util';
import { selectStateDocStatusById } from '../selectors/docStatus';
import DocStatusService from '../services/docStatus';
import { NotificationManager } from '@/services/notifications';

function* sagaInitDocStatus({ api }, { payload }) {
  try {
    if (payload.allowChangeStatus) {
      yield put(getAvailableToChangeStatuses(payload));
    }
    yield put(getDocStatus(payload));
  } catch (e) {
    console.error('[docStatus/sagaInitDocStatus saga] error', e);
  }
}

function* sagaGetDocStatus({ api }, { payload }) {
  const err = t('doc-status-widget.saga.error1');
  const { record, stateId } = payload;

  try {
    const res = yield call(api.docStatus.getDocStatus, { record });
    const status = DocStatusConverter.getStatusForWeb(head(res.records));

    yield put(
      setDocStatus({
        stateId,
        status: DocStatusService.processStatusFromServer(status)
      })
    );
  } catch (e) {
    NotificationManager.error(err, t('error'));
    console.error('[docStatus/sagaGetDocStatus saga] error', e);
  }
}

function* sagaGetAvailableToChangeStatuses({ api }, { payload }) {
  const err = t('doc-status-widget.saga.error2');
  const { record, stateId } = payload;

  try {
    const res = yield call(api.docStatus.getAvailableToChangeStatuses, { record });

    if (res && Array.isArray(res.records)) {
      yield put(
        setAvailableToChangeStatuses({
          stateId,
          availableToChangeStatuses: DocStatusConverter.getAvailableToChangeStatusesForWeb(res.records)
        })
      );
    }
  } catch (e) {
    NotificationManager.error(err, t('error'));
    console.error('[docStatus/sagaGetAvailableToChangeStatuses saga] error', e);
  }
}

function* sagaChangeDocStatus({ api }, { payload }) {
  const { record, stateId, status } = payload;
  const currentState = yield select(state => selectStateDocStatusById(state, stateId));
  const previousStatus = currentState.status;

  try {
    yield call(api.docStatus.setDocStatus, { record, status });
    yield put(getDocStatus({ stateId, record }));
    yield put(getAvailableToChangeStatuses({ stateId, record }));

    const instanceRecord = Records.get(record);
    instanceRecord.events.emit(EVENTS.ATTS_UPDATED);
    instanceRecord.events.emit(EVENTS.UPDATE_TASKS_WIDGETS);

    yield put(setChangeResult({ stateId, changeResult: 'success' }));
  } catch (e) {
    const serverMessage = get(e, 'messages[0].msg.msg') || get(e, 'message') || '';
    const errorText = serverMessage || t('doc-status-widget.saga.error3');

    yield put(setDocStatus({ stateId, status: previousStatus }));
    yield put(setChangeResult({ stateId, changeResult: 'error' }));
    NotificationManager.error(errorText, t('error'));
    console.error('[docStatus/sagaChangeDocStatus saga] error', e);
  }
}

function* docStatusSaga(ea) {
  yield takeEvery(initDocStatus().type, sagaInitDocStatus, ea);
  yield takeEvery(getDocStatus().type, sagaGetDocStatus, ea);
  yield takeEvery(getAvailableToChangeStatuses().type, sagaGetAvailableToChangeStatuses, ea);
  yield takeLatest(changeDocStatus().type, sagaChangeDocStatus, ea);
}

export default docStatusSaga;
