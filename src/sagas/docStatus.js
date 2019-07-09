import { call, put, takeEvery } from 'redux-saga/effects';
import { getDocStatus, initDocStatus, setDocStatus } from '../actions/docStatus';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';

function* sagaInitDocStatus({ api, logger }, { payload }) {
  yield put(getDocStatus(payload));
}

function* sagaGetDocStatus({ api, logger }, { payload }) {
  const err = t('Ошибка получения данных');

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

function* docStatusSaga(ea) {
  yield takeEvery(initDocStatus().type, sagaInitDocStatus, ea);
  yield takeEvery(getDocStatus().type, sagaGetDocStatus, ea);
}

export default docStatusSaga;
