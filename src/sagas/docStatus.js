import { head, isEmpty } from 'lodash';
import { call, put, takeEvery } from 'redux-saga/effects';
import {
  changeDocStatus,
  getAvailableToChangeStatuses,
  getCheckDocStatus,
  getDocStatus,
  initDocStatus,
  setAvailableToChangeStatuses,
  setCheckDocStatus,
  setDocStatus
} from '../actions/docStatus';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import DocStatusConverter from '../dto/docStatus';
import DocStatusService from '../services/docStatus';

function* sagaInitDocStatus({ api, logger }, { payload }) {
  yield put(getCheckDocStatus(payload));
  yield put(getAvailableToChangeStatuses(payload));
}

function* sagaCheckDocStatus({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  const isUpdating = yield call(api.docStatus.isUpdateDocStatus, { record });

  yield put(setCheckDocStatus({ isUpdating, stateId }));
}

function* sagaGetDocStatus({ api, logger }, { payload }) {
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
    yield put(setNotificationMessage(err));
    logger.error('[docStatus/sagaGetDocStatus saga] error', e.message);
  }
}

function* sagaGetAvailableToChangeStatuses({ api, logger }, { payload }) {
  const err = t('doc-status-widget.saga.error2');
  const { record, stateId } = payload;

  try {
    const res = yield call(api.docStatus.getAvailableToChangeStatuses, { record });

    if (!isEmpty(res)) {
      yield put(
        setAvailableToChangeStatuses({
          stateId,
          availableToChangeStatuses: DocStatusConverter.getAvailableToChangeStatusesForWeb(res.records)
        })
      );
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[docStatus/sagaGetAvailableToChangeStatuses saga] error', e.message);
  }
}

function* sagaChangeDocStatus({ api, logger }, { payload }) {
  const err = t('doc-status-widget.saga.error3');
  const { record } = payload;

  try {
    yield call(api.docStatus.setDocStatus, { record });
    yield put(getCheckDocStatus(payload));
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[docStatus/sagaChangeDocStatus saga] error', e.message);
  }
}

function* docStatusSaga(ea) {
  yield takeEvery(initDocStatus().type, sagaInitDocStatus, ea);
  yield takeEvery(getDocStatus().type, sagaGetDocStatus, ea);
  yield takeEvery(getAvailableToChangeStatuses().type, sagaGetAvailableToChangeStatuses, ea);
  yield takeEvery(changeDocStatus().type, sagaChangeDocStatus, ea);
  yield takeEvery(getCheckDocStatus().type, sagaCheckDocStatus, ea);
}

export default docStatusSaga;
