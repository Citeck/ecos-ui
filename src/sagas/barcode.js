import { call, put, takeEvery } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { getBarcode, setBarcode } from '../actions/barcode';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';

function* sagaGetBarcode({ api, logger }, { payload }) {
  const err = t('Ошибка получения данных');

  try {
    const { record, stateId } = payload;
    yield delay(1000);
    const res = yield call(api.barcode.getBarcode, { record });
    if (res && res.barcode) {
      yield put(setBarcode({ stateId, barcode: res.barcode, error: '' }));
    } else {
      yield put(setBarcode({ stateId, barcode: '', error: res.error }));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[barcode/sagaGetBarcode saga] error', e.message);
  }
}

function* barcodeSaga(ea) {
  yield takeEvery(getBarcode().type, sagaGetBarcode, ea);
}

export default barcodeSaga;
