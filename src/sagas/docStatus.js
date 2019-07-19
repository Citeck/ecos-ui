import { head, isEmpty } from 'lodash';
import { call, put, takeEvery } from 'redux-saga/effects';
import {
  changeDocStatus,
  getAvailableStatuses,
  getCheckDocStatus,
  getDocStatus,
  initDocStatus,
  setAvailableStatuses,
  setCheckDocStatus,
  setDocStatus
} from '../actions/docStatus';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import DocStatusConverter from '../dto/docStatus';

function* sagaInitDocStatus({ api, logger }, { payload }) {
  yield put(getCheckDocStatus(payload));
  yield put(getAvailableStatuses(payload));
}

function* sagaCheckDocStatus({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  const isUpdating = yield call(api.docStatus.isUpdateDocStatus, { record });

  yield put(setCheckDocStatus({ isUpdating, stateId }));
}

function* sagaGetDocStatus({ api, logger }, { payload }) {
  const err = t('Ошибка получения статуса документа');
  const { record, stateId } = payload;

  try {
    const res = yield call(api.docStatus.getDocStatus, { record });

    if (!isEmpty(res)) {
      yield put(
        setDocStatus({
          stateId,
          status: DocStatusConverter.getStatusForWeb(head(res.records))
        })
      );
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[doc-status/sagaGetDocStatus saga] error', e.message);
  }
}

function* sagaGetAvailableStatuses({ api, logger }, { payload }) {
  const err = t('Ошибка получения доступных статусов');
  const { record, stateId } = payload;

  try {
    const res = yield call(api.docStatus.getAvailableStatuses, { record });

    if (!isEmpty(res)) {
      yield put(
        setAvailableStatuses({
          stateId,
          availableStatuses: DocStatusConverter.getAvailableStatusesForWeb(res.records)
        })
      );
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[doc-status/sagaGetAvailableStatuses saga] error', e.message);
  }
}

function* sagaChangeDocStatus({ api, logger }, { payload }) {
  const err = t('Ошибка изменения статуса');
  const { record, stateId } = payload;

  try {
    yield call(api.docStatus.setDocStatus, { record });
    yield put(getDocStatus(payload));
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[doc-status/sagaGetAvailableStatuses saga] error', e.message);
  }
}

function* docStatusSaga(ea) {
  yield takeEvery(initDocStatus().type, sagaInitDocStatus, ea);
  yield takeEvery(getDocStatus().type, sagaGetDocStatus, ea);
  yield takeEvery(getAvailableStatuses().type, sagaGetAvailableStatuses, ea);
  yield takeEvery(changeDocStatus().type, sagaChangeDocStatus, ea);
  yield takeEvery(getCheckDocStatus().type, sagaCheckDocStatus, ea);
}

export default docStatusSaga;
