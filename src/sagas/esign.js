import { delay } from 'redux-saga';
import { put, select, takeEvery } from 'redux-saga/effects';
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
  setDocStatus
} from '../actions/esign';
import { selectGeneralState, selectCertificate } from '../selectors/esign';
import { selectUserName } from '../selectors/user';
import EsignConverter from '../dto/esign';
import { ErrorTypes, DocStatuses, Labels } from '../constants/esign';
import { t } from '../helpers/util';

function* sagaInit({ api, logger }, { payload }) {
  try {
    if (!payload) {
      throw new Error(t(Labels.NODE_REF_NOT_FOUND));
    }

    const { cadespluginApi: cadesApi, isFetchingApi } = yield select(selectGeneralState);

    /**
     * Запрашиваем статус документа, чтобы определить, нужна подпись или нет
     */
    const status = yield api.esign.checkDocumentStatus(payload);

    yield put(setDocStatus({ id: payload, isNeedToSign: get(status, 'statusId', '') === DocStatuses.SIGNING }));

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

function* sagaSignDocument({ api, logger }, { payload }) {
  try {
    const document = yield api.esign.getDocumentData(payload.id);
    const base64 = get(document, 'data.0.base64', '');

    if (!base64) {
      yield put(
        setMessage({
          id: payload.id,
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_BASE64_DOC_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        })
      );
      return;
    }

    /**
     * получаем отпечаток сертификата по id
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
      yield put(
        setMessage({
          id: payload.id,
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.SIGN_FAILED_VERIFICATION_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        })
      );
      return;
    }

    const user = yield select(selectUserName);

    yield api.esign.sendSignedDocument(payload.id, signedMessage, user);
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

function* saga(ea) {
  yield takeEvery(init().type, sagaInit, ea);
  yield takeEvery([getCertificates().type, setApi().type], sagaGetCertificates, ea);
  yield takeEvery(signDocument().type, sagaSignDocument, ea);
}

export default saga;
