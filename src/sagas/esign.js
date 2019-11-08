import { put, select, takeEvery } from 'redux-saga/effects';
import get from 'lodash/get';

import {
  init,
  initError,
  initSuccess,
  setApi,
  setCertificates,
  getCertificates,
  setMessage,
  setErrorType,
  signDocument,
  fetchApi,
  signDocumentSuccess
} from '../actions/esign';
import { selectGeneralState, selectCertificate } from '../selectors/esign';
import { selectUserName } from '../selectors/user';
import EsignConverter from '../dto/esign';
import { ErrorTypes } from '../constants/esign';

function* sagaInit({ api, logger }, action) {
  try {
    const { cadespluginApi: cadesApi, isFetchingApi } = yield select(selectGeneralState);

    if (cadesApi === null && !isFetchingApi) {
      yield put(fetchApi());

      const cadespluginApi = yield api.esign.getCadespluginApi();

      yield put(setApi({ id: action.payload, cadespluginApi }));
    }

    yield put(getCertificates(action.payload));
    yield put(initSuccess(action.payload));
  } catch (e) {
    const hasPlugin = api.esign.hasCadesplugin;

    yield put(
      setMessage({
        id: action.payload,
        messageTitle: hasPlugin ? 'Ошибка' : 'Установите расширение',
        messageDescription: hasPlugin ? e.message : 'Чтобы продолжить, установите расширение Cryptopro для браузера с сайта cryptopro.ru'
      })
    );
    yield put(
      setErrorType({
        id: action.payload,
        errorType: hasPlugin ? ErrorTypes.DEFAULT : ErrorTypes.NO_CADESPLUGIN
      })
    );
    yield put(initError(action.payload));
    logger.error('[esign sagaInit saga error', e.message);
  }
}

function* sagaGetCertificates({ api, logger }, action) {
  try {
    const { cadespluginApi } = yield select(selectGeneralState);

    if (cadespluginApi === null) {
      throw new Error();
    }

    const certificates = yield Promise.all(
      (yield api.esign.getCertificates()).map(async function(certificate) {
        return await EsignConverter.getCertificateForModal(certificate);
      })
    );

    yield put(
      setCertificates({
        id: action.payload,
        certificates,
        selectedCertificate: get(certificates, '0.id', ''),
        messageTitle: certificates.length ? '' : 'Нет доступных сертификатов',
        messageDescription: ''
      })
    );

    if (!certificates.length) {
      yield put(
        setErrorType({
          id: action.payload,
          errorType: ErrorTypes.NO_CERTIFICATES
        })
      );
    }
  } catch (e) {
    logger.error('[esign sagaGetCertificates saga error', e.message);
  }
}

function* sagaSignDocument({ api, logger }, { payload }) {
  try {
    // TODO: разобраться с ошибками на примере community стенда
    const document = yield api.esign.getDocumentData(payload.id);
    const base64 = get(document, 'data.0.base64', '');

    if (!base64) {
      // TODO: Error message

      return;
    }

    /**
     * получаем thumbprint значение сертификата по id
     */
    const thumbprint = yield select(state => selectCertificate(state, payload.id));

    if (!thumbprint) {
      // TODO: Error message

      return;
    }

    /**
     * Получаем сообщение подписанного документа
     */
    const signedMessage = yield api.esign.getSignedDocument(thumbprint, base64);

    /**
     * Проверяем на валидность сообщение о подписи и документ
     */
    const isVerified = yield api.esign.verifySigned(signedMessage, base64);

    if (!isVerified) {
      // TODO: Error message

      return;
    }

    const user = yield select(selectUserName);
    const response = yield api.esign.sendSignedDocument(payload.id, signedMessage, user);

    if (!response.data) {
      // TODO: Error message

      return;
    }

    yield put(signDocumentSuccess(payload.id));
  } catch (e) {
    logger.error('[esign sagaSignDocument saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(init().type, sagaInit, ea);
  yield takeEvery(getCertificates().type, sagaGetCertificates, ea);
  yield takeEvery(signDocument().type, sagaSignDocument, ea);
}

export default saga;
