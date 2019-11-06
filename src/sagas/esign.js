import { put, select, takeEvery } from 'redux-saga/effects';

import { setApi, init, setCertificates } from '../actions/esign';
import EsignConverter from '../dto/esign';

function* sagaInit({ api, logger }, action) {
  try {
    const cadespluginApi = yield api.esign.getCadespluginApi();

    api.esign.setCadespluginApi(cadespluginApi);
    yield put(setApi({ id: action.payload, cadespluginApi }));

    const certificates = yield Promise.all(
      (yield api.esign.getCertificates()).map(async function(certificate) {
        return await EsignConverter.getCertificateForModal(certificate);
      })
    );

    yield put(setCertificates({ id: action.payload, certificates }));
  } catch (e) {
    logger.error('[esign sagaInit saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(init().type, sagaInit, ea);
}

export default saga;
