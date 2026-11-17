import { call, put, takeEvery } from 'redux-saga/effects';

import {
  getBarcodePrintPdf,
  getBase64Barcode,
  init,
  setAllowedTypes,
  setBase64Barcode,
  setDisplayElements,
  setError
} from '../actions/barcode';
import { t } from '../helpers/util';

function* sagaInit({ api }, { payload: { stateId, record, config } }) {
  try {
    const allowedTypes = yield call(api.barcode.getAllowedTypes);
    const displayElements = yield call(api.dashboard.getDisplayElementsByCondition, config.elementsDisplayCondition, { recordRef: record });

    yield put(setDisplayElements({ stateId, displayElements }));
    yield put(setAllowedTypes({ stateId, allowedTypes }));
  } catch (e) {
    yield put(setError({ stateId, error: t('barcode-widget.saga.error1') }));
    console.error('[barcode/sagaInit saga] error', e);
  }
}

function* sagaGetBase64Barcode({ api }, { payload }) {
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
    console.error('[barcode/sagaGetBase64Barcode saga] error', e);
  }
}

export function* sagaGetBarcodePrintPdf({ api }, { payload: { record, printSettings, signal, onSuccess, onError } }) {
  try {
    const blob = yield call(api.barcode.getPrintPdf, { record, printSettings, signal });
    onSuccess(blob);
  } catch (error) {
    onError(error);
  }
}

function* barcodeSaga(ea) {
  yield takeEvery(getBarcodePrintPdf().type, sagaGetBarcodePrintPdf, ea);
  yield takeEvery(getBase64Barcode().type, sagaGetBase64Barcode, ea);
  yield takeEvery(init().type, sagaInit, ea);
}

export default barcodeSaga;
