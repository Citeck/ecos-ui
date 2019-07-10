import { call, put, takeEvery } from 'redux-saga/effects';
import { getAvailableStatuses, getDocStatus, initDocStatus, setAvailableStatuses, setDocStatus } from '../actions/docStatus';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import { delay } from 'redux-saga';

function* sagaInitDocStatus({ api, logger }, { payload }) {
  yield delay(1000);
  yield put(getDocStatus(payload));
  yield put(getAvailableStatuses(payload));
}

function* sagaGetDocStatus({ api, logger }, { payload }) {
  const err = t('Ошибка получения статуса документа');

  try {
    const { record, stateId } = payload;
    const res = yield call(api.docStatus.getDocStatus, { record });

    if (res && Object.keys(res)) {
      yield put(setDocStatus({ stateId, status: res }));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[doc-status/sagaGetDocStatus saga] error', e.message);
  }
}

function* sagaGetAvailableStatuses({ api, logger }, { payload }) {
  const err = t('Ошибка получения доступных статусов');

  try {
    const { record, stateId } = payload;
    const res = yield call(api.docStatus.getAvailableStatuses, { record });

    if (res && Object.keys(res)) {
      yield put(setAvailableStatuses({ stateId, availableStatuses: res }));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[doc-status/sagaGetAvailableStatuses saga] error', e.message);
  }
}

function* docStatusSaga(ea) {
  yield takeEvery(initDocStatus().type, sagaInitDocStatus, ea);
  yield takeEvery(getDocStatus().type, sagaGetDocStatus, ea);
  yield takeEvery(getAvailableStatuses().type, sagaGetAvailableStatuses, ea);
}

export default docStatusSaga;
