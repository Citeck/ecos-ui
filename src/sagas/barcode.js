import { call, put, takeEvery } from 'redux-saga/effects';
import { getBase64Barcode, init, setAllowedTypes, setBase64Barcode, setDisplayElements, setError } from '../actions/barcode';
import { t } from '../helpers/util';

function* sagaInit({ api, logger }, { payload: { stateId, record, config } }) {
  try {
    const allowedTypes = yield call(api.barcode.getAllowedTypes);
    const displayElements = yield call(api.dashboard.getDisplayElementsByCondition, config.elementsDisplayCondition, { recordRef: record });

    yield put(setDisplayElements({ stateId, displayElements }));
    yield put(setAllowedTypes({ stateId, allowedTypes }));
  } catch (e) {
    yield put(setError({ stateId, error: t('barcode-widget.saga.error1') }));
    logger.error('[barcode/sagaInit saga] error', e.message);
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
  yield takeEvery(getBase64Barcode().type, sagaGetBase64Barcode, ea);
  yield takeEvery(init().type, sagaInit, ea);
}

export default barcodeSaga;
