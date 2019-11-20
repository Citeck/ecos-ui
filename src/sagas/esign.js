import { delay } from 'redux-saga';
import { put, select, takeEvery, all } from 'redux-saga/effects';
import get from 'lodash/get';

import {
  init,
  initError,
  initSuccess,
  fetchApi,
  setApi,
  setCertificates,
  getCertificates,
  setMessage,
  setErrorType,
  signDocument,
  signDocumentSuccess,
  toggleSignModal
} from '../actions/esign';
import { selectGeneralState, selectCertificate } from '../selectors/esign';
import { selectUserName } from '../selectors/user';
import EsignConverter from '../dto/esign';
import { ErrorTypes, Labels } from '../constants/esign';
import { t } from '../helpers/util';

function* sagaInit({ api, logger }, { payload }) {
  try {
    const { cadespluginApi: cadesApi, isFetchingApi } = yield select(selectGeneralState);

    if (isFetchingApi) {
      yield put(initSuccess(payload));

      return;
    }

    if (cadesApi === null) {
      yield put(fetchApi());
      const cadespluginApi = yield api.esign.getCadespluginApi();

      yield delay(5000);
      yield put(setApi({ id: payload, cadespluginApi }));
    }

    yield put(initSuccess(payload));

    if (!payload) {
      throw new Error(t(Labels.NODE_REF_NOT_FOUND));
    }
  } catch (e) {
    const hasPlugin = api.esign.hasCadesplugin;
    const { isFetchingApi } = yield select(selectGeneralState);

    yield put(
      setMessage({
        id: payload,
        messageTitle: hasPlugin || isFetchingApi ? t(Labels.ERROR) : t(Labels.ADD_PLUGIN),
        messageDescription: hasPlugin || isFetchingApi ? e.message : t(Labels.ADD_PLUGIN_MESSAGE),
        errorType: hasPlugin || isFetchingApi ? t(ErrorTypes.DEFAULT) : t(ErrorTypes.NO_CADESPLUGIN)
      })
    );
    yield put(initError(payload));
    logger.error('[esign sagaInit saga error', e.message);
  }
}

function* sagaGetCertificates({ api, logger }, { payload }) {
  try {
    const { cadespluginApi } = yield select(selectGeneralState);

    if (cadespluginApi === null) {
      throw new Error('cadespluginApi is null');
    }

    const certificates = yield Promise.all(
      (yield api.esign.getCertificates()).map(async function(certificate) {
        return await EsignConverter.getCertificateForModal(certificate);
      })
    );

    yield put(
      setCertificates({
        certificates,
        messageTitle: certificates.length ? '' : t(Labels.NO_CERTIFICATES_MESSAGE),
        messageDescription: ''
      })
    );

    if (!certificates.length) {
      yield put(
        setErrorType({
          id: payload,
          errorType: ErrorTypes.NO_CERTIFICATES
        })
      );
    }
  } catch (e) {
    const hasPlugin = api.esign.hasCadesplugin;

    yield put(
      setMessage({
        id: payload,
        messageTitle: hasPlugin ? t(Labels.ERROR) : t(Labels.ADD_PLUGIN),
        messageDescription: hasPlugin ? e.message : t(Labels.ADD_PLUGIN_MESSAGE),
        errorType: hasPlugin ? t(ErrorTypes.DEFAULT) : t(ErrorTypes.NO_CADESPLUGIN)
      })
    );
    logger.error('[esign sagaGetCertificates saga error', e.message);
  }
}

function* signDocumentByNode({ api, logger }, { payload, document }) {
  try {
    /**
     * Получаем base64-строку документа для дальнейшего подписания
     */
    const documentResponse = yield api.esign.getDocumentData(document);
    const base64 = get(documentResponse, 'data.0.base64', '');

    if (!base64) {
      yield put(
        setMessage({
          id: payload.id,
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_BASE64_DOC_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        })
      );

      return false;
    }

    /**
     * Получаем отпечаток сертификата по id
     */
    const thumbprint = yield select(state => selectCertificate(state, payload.id, payload.certificateId));

    if (!thumbprint) {
      yield put(
        setMessage({
          id: payload.id,
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_CERTIFICATE_THUMBPRINT_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        })
      );

      return false;
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
      yield put(
        setMessage({
          id: payload.id,
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.SIGN_FAILED_VERIFICATION_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        })
      );

      return false;
    }

    const user = yield select(selectUserName);

    const signResponse = yield api.esign.sendSignedDocument(document, signedMessage, user);

    return get(signResponse, 'data', false);
  } catch (e) {
    yield put(
      setMessage({
        id: payload.id,
        messageTitle: t(Labels.ERROR),
        messageDescription: t(Labels.SIGN_FAILED_MESSAGE),
        errorType: t(ErrorTypes.DEFAULT)
      })
    );
    logger.error('[esign sagaSignDocument saga error', e.message);
  }
}

function* sagaSignDocument({ api, logger }, { payload }) {
  try {
    const documents = yield api.esign.getDocuments(payload.url);
    const signStatuses = yield all(documents.map(document => signDocumentByNode({ api, logger }, { payload, document })));

    if (signStatuses.includes(false)) {
      throw new Error(t(Labels.SIGN_FAILED_MESSAGE));
    }

    yield put(signDocumentSuccess(payload.id));
  } catch (e) {
    yield put(
      setMessage({
        id: payload.id,
        messageTitle: t(Labels.ERROR),
        messageDescription: t(Labels.SIGN_FAILED_MESSAGE),
        errorType: t(ErrorTypes.DEFAULT)
      })
    );
    logger.error('[esign sagaSignDocument saga error', e.message);
  }
}

function* sagaToggleSignModal({ api, logger }, { payload }) {
  try {
    const { cadespluginApi, isFetchingApi } = yield select(selectGeneralState);

    if (!cadespluginApi && !isFetchingApi) {
      return yield put(
        setMessage({
          id: payload.id,
          messageTitle: t(Labels.ADD_PLUGIN),
          messageDescription: t(Labels.ADD_PLUGIN_MESSAGE),
          errorType: t(ErrorTypes.NO_CADESPLUGIN)
        })
      );
    }

    if (!payload.id) {
      return yield put(
        setMessage({
          id: payload.id,
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NODE_REF_NOT_FOUND),
          errorType: t(ErrorTypes.DEFAULT)
        })
      );
    }

    if (!payload.url) {
      return yield put(
        setMessage({
          id: payload.id,
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.GET_DOCUMENT_URL_NOT_FOUND),
          errorType: t(ErrorTypes.DEFAULT)
        })
      );
    }

    if (isFetchingApi) {
      return yield put(
        setMessage({
          id: payload.id,
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.PLUGIN_IS_FETCHING_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        })
      );
    }
  } catch (e) {
    logger.error('[esign sagaToggleSignModal saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(init().type, sagaInit, ea);
  yield takeEvery([getCertificates().type, setApi().type], sagaGetCertificates, ea);
  yield takeEvery(signDocument().type, sagaSignDocument, ea);
  yield takeEvery(toggleSignModal().type, sagaToggleSignModal, ea);
}

export default saga;
