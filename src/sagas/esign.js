import { delay } from 'redux-saga';
import { put, select, call, takeEvery } from 'redux-saga/effects';

import { setApi, init, setCertificates, getCertificates } from '../actions/esign';
import EsignConverter from '../dto/esign';

function* sagaInit({ api, logger }, action) {
  try {
    const cadespluginApi = yield api.esign.getCadespluginApi();

    api.esign.setCadespluginApi(cadespluginApi);
    yield put(setApi({ id: action.payload, cadespluginApi }));
    yield put(getCertificates(action.payload));
  } catch (e) {
    logger.error('[esign sagaInit saga error', e.message);
  }
}

function* sagaGetCertificates({ api, logger }, action) {
  try {
    const certificates = yield Promise.all(
      (yield api.esign.getCertificates()).map(async function(certificate) {
        return await EsignConverter.getCertificateForModal(certificate);
      })
    );

    yield delay(1000);

    yield put(setCertificates({ id: action.payload, certificates }));
  } catch (e) {
    logger.error('[esign sagaGetCertificates saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(init().type, sagaInit, ea);
  yield takeEvery(getCertificates().type, sagaGetCertificates, ea);
}

export default saga;
