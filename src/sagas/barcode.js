import { call, put, takeEvery } from 'redux-saga/effects';
import { getGeneratedBarcode, setGeneratedBarcode, getBase64Barcode, setBase64Barcode, setError } from '../actions/barcode';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';

// deprecated?
function* sagaGetGeneratedBarcode({ api, logger }, { payload }) {
  const err = t('barcode-widget.saga.error1');

  try {
    const { record, stateId } = payload;
    const res = yield call(api.barcode.getGeneratedBarcode, { record });

    if (res && res.barcode) {
      yield put(setGeneratedBarcode({ stateId, barcode: res.barcode, error: '' }));
    } else {
      yield put(setGeneratedBarcode({ stateId, barcode: '', error: res.error }));
    }
  } catch (e) {
    yield put(setNotificationMessage(err));
    logger.error('[barcode/sagaGetGeneratedBarcode saga] error', e.message);
  }
}

function* sagaGetBase64Barcode({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    const response = yield call(api.barcode.getBade64Barcode, {
      record,
      params: { height: 100, width: 210 }
    });

    if (response.data) {
      yield put(setBase64Barcode({ stateId, barcode: `data:image/png;base64,${response.data}` }));
    } else {
      yield put(setError({ stateId, error: response.error || t('barcode-widget.saga.error1') }));
    }
  } catch (e) {
    yield put(setError({ stateId, error: t('barcode-widget.saga.error1') }));
    logger.error('[barcode/sagaGetBase64Barcode saga] error', e.message);
  }
}

function* barcodeSaga(ea) {
  yield takeEvery(getGeneratedBarcode().type, sagaGetGeneratedBarcode, ea); // deprecated?
  yield takeEvery(getBase64Barcode().type, sagaGetBase64Barcode, ea);
}

export default barcodeSaga;
