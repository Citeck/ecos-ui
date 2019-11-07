import { delay } from 'redux-saga';
import { put, select, call, takeEvery } from 'redux-saga/effects';
import get from 'lodash/get';

import { setApi, init, setCertificates, getCertificates, setError } from '../actions/esign';
import EsignConverter from '../dto/esign';

function* sagaInit({ api, logger }, action) {
  try {
    const cadespluginApi = yield api.esign.getCadespluginApi();
    const version = yield api.esign.getPluginVersion();

    console.warn('version => ', version);

    yield put(setApi({ id: action.payload, cadespluginApi }));
    yield put(getCertificates(action.payload));
  } catch (e) {
    yield put(
      setError({
        id: action.payload,
        message: api.esign.hasCadesplugin
          ? e.message
          : 'Чтобы продолжить, установите расширение Cryptopro для браузера с сайта cryptopro.ru'
      })
    );
    console.warn(e);
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

    yield put(
      setCertificates({
        id: action.payload,
        certificates,
        selectedCertificate: get(certificates, '0.id', '')
      })
    );
  } catch (e) {
    logger.error('[esign sagaGetCertificates saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(init().type, sagaInit, ea);
  yield takeEvery(getCertificates().type, sagaGetCertificates, ea);
}

export default saga;
