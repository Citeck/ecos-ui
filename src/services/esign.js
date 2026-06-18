import React from 'react';
import ReactDOM from 'react-dom';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';

import cadesPluginApi from '../api/cadesPluginEsign';
import eimzoApi from '../api/eimzoEsign';
import commonEsignApi from '../api/commonEsign';
import CriptoProEsignComponent from '../components/Esign/CriptoProEsign';
import EimzoEsignComponent from '../components/Esign/EimzoEsign';
import EsignConverter from '../dto/esign';
import { ErrorTypes, Labels } from '../constants/esign';
import { objectByString, t } from '../helpers/util';
import Records from '../components/Records';

class Esign {
  static #queryParams = {};

  sign = async (recordRefs, componentProps = {}, queryParams = false) => {
    if (!recordRefs) {
      return new Error(`The "recordRefs" argument is required`);
    }

    let params;

    switch (typeof queryParams) {
      case 'boolean':
        params = { isApprovementSignature: queryParams };
        break;
      case 'object':
        params = queryParams instanceof Array ? {} : queryParams;
        break;
      default:
        params = '';
    }

    Esign.#queryParams = cloneDeep(params, {});

    if (!Array.isArray(recordRefs)) {
      recordRefs = [recordRefs];
    }

    const signCountry = await this.resolveSignCountry(recordRefs);

    const EsignComponent = signCountry === 'UZ' ? EimzoEsignComponent : CriptoProEsignComponent;

    const container = document.createElement('div');

    ReactDOM.render(
      <EsignComponent
        recordRefs={recordRefs}
        {...componentProps}
        onClose={() => {
          this.#onClose(container);
        }}
      />,
      container
    );

    document.body.appendChild(container);
  };

  #onClose = container => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  };

  get isApiReady() {
    return cadesPluginApi.hasCadesplugin;
  }

  static initCriptoPro = async (recordRefs = []) => {
    try {
      if (!recordRefs.length) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NODE_REF_NOT_FOUND),
          errorType: t(ErrorTypes.DEFAULT)
        });
      }

      if (cadesPluginApi.cadespluginApi) {
        return cadesPluginApi.cadespluginApi;
      }

      return await cadesPluginApi.getCadespluginApi();
    } catch (e) {
      const hasPlugin = cadesPluginApi.hasCadesplugin;

      console.error('[EsignService init] error ', e.message);

      return Promise.reject({
        messageTitle: hasPlugin ? t(Labels.EDS_ERROR) : t(Labels.ADD_PLUGIN),
        messageDescription: hasPlugin ? e.message : t(Labels.ADD_PLUGIN_MESSAGE),
        errorType: hasPlugin ? t(ErrorTypes.DEFAULT) : t(ErrorTypes.NO_CADESPLUGIN),
        formattedError: e.formattedError || Esign.formatErrorMessage(e)
      });
    }
  };

  static initEimzo = async (recordRefs = []) => {
    if (!recordRefs.length) {
      return Promise.reject({
        messageTitle: t(Labels.ERROR),
        messageDescription: t(Labels.NODE_REF_NOT_FOUND),
        errorType: t(ErrorTypes.DEFAULT)
      });
    }
    const isActive = await eimzoApi.hasActiveEimzo();

    if (!isActive) {
      return Promise.reject({
        messageTitle: t(Labels.ADD_EIMZO),
        messageDescription: t(Labels.ADD_EIMZO_MESSAGE),
        errorType: t(ErrorTypes.DEFAULT)
      });
    }
    await eimzoApi.registerApiKey();

    return true;
  };

  static getCriptoProCertificates = async () => {
    try {
      if (!cadesPluginApi.cadespluginApi) {
        throw new Error('cadespluginApi is null');
      }

      const certificates = await Promise.all(
        (await cadesPluginApi.getCertificates()).map(async function(certificate) {
          return await EsignConverter.getCertificateForModal(certificate);
        })
      );

      if (!certificates.length) {
        return Promise.reject({
          messageTitle: t(Labels.NO_CERTIFICATES_MESSAGE),
          messageDescription: '',
          formattedError: Esign.formatErrorMessage({}, t(Labels.ACTION_GET_CERT))
        });
      }

      return certificates;
    } catch (e) {
      const hasPlugin = cadesPluginApi.hasCadesplugin;

      console.error('[EsignService getCriptoProCertificates] error ', e.message);

      return Promise.reject({
        messageTitle: hasPlugin ? t(Labels.EDS_ERROR) : t(Labels.ADD_PLUGIN),
        messageDescription: hasPlugin ? e.message : t(Labels.ADD_PLUGIN_MESSAGE),
        errorType: hasPlugin ? t(ErrorTypes.DEFAULT) : t(ErrorTypes.NO_CADESPLUGIN),
        formattedError: e.formattedError || Esign.formatErrorMessage(e)
      });
    }
  };

  static getEimzoCertificates = async () => {
    try {
      let usbTokens = await Promise.all(
        (await eimzoApi.getUSBTokens()).map(async function(certificate) {
          return await EsignConverter.getEimzoUsbTokensForModal(certificate);
        })
      );
      //Расскомментировать для имитации вставленного USB-токена (нескольких)
      //usbTokens = [{"id":"Имитация первого USB токена", "name":"USB-токен: Имитация первого USB токена", "provider": "E-IMZO", "deviceId":"DeviceId первого USB токена"}, {"id":"Имитация второго USB токена", "name":"USB-токен: Имитация второго USB токена", "provider": "E-IMZO", "deviceId":"DeviceId второго USB токена"}];

      if (usbTokens.length > 0) {
        return usbTokens;
      }

      const certificates = await Promise.all(
        (await eimzoApi.getAllCertificates()).map(async function(certificate) {
          return await EsignConverter.getEimzoCertificateForModal(certificate);
        })
      );

      if (!certificates.length) {
        return Promise.reject({
          messageTitle: t(Labels.NO_CERTIFICATES_MESSAGE),
          messageDescription: 'Проверьте наличие сертификатов в папке DSKEYS'
        });
      }

      return certificates;
    } catch (e) {
      console.error('[EsignService getEimzoCertificates] error ', e.message);

      return Promise.reject({
        messageTitle: t(Labels.EDS_ERROR),
        messageDescription: e.message,
        errorType: t(ErrorTypes.DEFAULT),
        formattedError: e.formattedError || Esign.formatErrorMessage(e)
      });
    }
  };

  static formatErrorMessage = (error, action) => {
    return objectByString({ action: action ? t(Labels.ACTION, { action }) : '', ...error });
  };

  async resolveSignCountry(recordRefs) {
    for (const ref of recordRefs) {
      const value = await Records.get(ref).load('sam:signCountry');
      if (value) {
        return value;
      }
    }
    return 'RU';
  }

  static signDocumentByNodeCryptoPro = async (thumbprint, document) => {
    try {
      if (!thumbprint) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_CERTIFICATE_THUMBPRINT_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT),
          formattedError: Esign.formatErrorMessage({}, t(Labels.ACTION_CHECK_THUMB))
        });
      }

      const documentResponse = await commonEsignApi.getDocumentData(document);
      const base64 = get(documentResponse, 'data.0.base64', '');

      if (!base64) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_BASE64_DOC_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT),
          formattedError: Esign.formatErrorMessage(
            {
              ...documentResponse,
              document
            },
            t(Labels.ACTION_BASE64)
          )
        });
      }

      const signedMessage = await cadesPluginApi.getSignedDocument(thumbprint, base64);
      const isVerified = await cadesPluginApi.verifySigned(signedMessage, base64);

      if (!isVerified) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.SIGN_FAILED_VERIFICATION_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT),
          formattedError: Esign.formatErrorMessage(
            {
              ...documentResponse,
              document,
              signedMessage
            },
            t(Labels.ACTION_VERIFICATION)
          )
        });
      }

      const user = await get(window, 'Alfresco.constants.USERNAME', '');
      const signResponse = await commonEsignApi.sendSignedDocument(
        EsignConverter.getSignQueryParams({ ...Esign.#queryParams, document, signedMessage, user })
      );

      return get(signResponse, 'data', false);
    } catch (e) {
      console.error('[EsignService signDocumentByNodeCryptoPro] error ', e.message);

      return Promise.reject({
        messageTitle: t(Labels.EDS_ERROR),
        messageDescription: e.messageDescription || t(Labels.SIGN_FAILED_MESSAGE),
        errorType: t(ErrorTypes.DEFAULT),
        formattedError: e.formattedError || Esign.formatErrorMessage(e)
      });
    }
  };

  static signDocumentByNodeEimzo = async (keyIdForSign, document) => {
    try {
      if (!keyIdForSign) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_CERTIFICATE_THUMBPRINT_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT),
          formattedError: Esign.formatErrorMessage({}, t(Labels.ACTION_CHECK_THUMB))
        });
      }

      const actionType = Esign.#queryParams.actionType;
      const comment = Esign.#queryParams.comment;
      const direction = Esign.#queryParams.direction;

      const documentResponse = await commonEsignApi.getDataForSignFromProvider(document, 'DIDOX', actionType, direction, comment);
      const base64 = get(documentResponse, 'base64doc', '');

      if (!base64) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_BASE64_DOC_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT),
          formattedError: Esign.formatErrorMessage(
            {
              ...documentResponse,
              document
            },
            t(Labels.ACTION_BASE64)
          )
        });
      }

      const signatureResponse = await eimzoApi.getSignedDocument(keyIdForSign, base64);
      if (signatureResponse.success == false) {
        alert('Не удалось создать подпись в E-IMZO: ' + signatureResponse.error);
        return;
      }

      const signedMessage = get(signatureResponse, 'pkcs7_64', '');
      const signHex = get(signatureResponse, 'signature_hex', '');
      const signCountry = 'UZ';

      const user = await get(window, 'Alfresco.constants.USERNAME', '');
      const signResponse = await commonEsignApi.sendSignedDocument(
        EsignConverter.getSignQueryParams({ ...Esign.#queryParams, document, signedMessage, user, signCountry, signHex })
      );

      return get(signResponse, 'data', false);
    } catch (e) {
      console.error('[EsignService signDocumentByNodeEimzo] error ', e.message);

      return Promise.reject({
        messageTitle: t(Labels.EDS_ERROR),
        messageDescription: e.messageDescription || t(Labels.SIGN_FAILED_MESSAGE),
        errorType: t(ErrorTypes.DEFAULT),
        formattedError: e.formattedError || Esign.formatErrorMessage(e)
      });
    }
  };

  static signDocumentCryptoPro = async (documents = [], certificate = null, setSignatures) => {
    try {
      if (!documents.length) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NODE_REF_NOT_FOUND),
          errorType: t(ErrorTypes.DEFAULT)
        });
      }

      if (!certificate) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_CERTIFICATE_THUMBPRINT_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        });
      }

      const signStatuses = await Promise.all(
        documents.map(async document => await Esign.signDocumentByNodeCryptoPro(certificate.thumbprint, document))
      );

      const stringSignatures = signStatuses.filter(signature => isString(signature));
      isFunction(setSignatures) && setSignatures(stringSignatures);

      if (signStatuses.includes(false)) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.SIGN_FAILED_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT),
          formattedError: Esign.formatErrorMessage(
            {
              notSignedDocuments: documents.filter((d, i) => !signStatuses[i])
            },
            t(Labels.ACTION_SIGN_DOCS)
          )
        });
      }

      return true;
    } catch (e) {
      console.error('[EsignService signDocument] error ', e.message);

      return Promise.reject({
        messageTitle: t(Labels.EDS_ERROR),
        messageDescription: e.messageDescription || t(Labels.SIGN_FAILED_MESSAGE),
        errorType: t(ErrorTypes.DEFAULT),
        formattedError: e.formattedError || Esign.formatErrorMessage(e)
      });
    }
  };

  static signDocumentEimzo = async (documents = [], certificate = null, setSignatures) => {
    try {
      if (!documents.length) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NODE_REF_NOT_FOUND),
          errorType: t(ErrorTypes.DEFAULT)
        });
      }

      if (!certificate) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_CERTIFICATE_THUMBPRINT_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        });
      }

      const keyIdForSign = certificate.deviceId
        ? 'ckc'
        : get(await eimzoApi.getPfxPrivateKey({ ...certificate, name: certificate.id }), 'keyId', '');

      const signStatuses = [];

      for (const document of documents) {
        const result = await Esign.signDocumentByNodeEimzo(keyIdForSign, document);
        if (result === undefined) {
          return;
        }
        signStatuses.push(result);
      }

      const stringSignatures = signStatuses.filter(signature => isString(signature));
      isFunction(setSignatures) && setSignatures(stringSignatures);

      if (signStatuses.includes(false)) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.SIGN_FAILED_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT),
          formattedError: Esign.formatErrorMessage(
            {
              notSignedDocuments: documents.filter((d, i) => !signStatuses[i])
            },
            t(Labels.ACTION_SIGN_DOCS)
          )
        });
      }

      return true;
    } catch (e) {
      console.error('[EsignService signDocumentEimzo] error ', e.message);

      return Promise.reject({
        messageTitle: t(Labels.EDS_ERROR),
        messageDescription: e.messageDescription || t(Labels.SIGN_FAILED_MESSAGE),
        errorType: t(ErrorTypes.DEFAULT),
        formattedError: e.formattedError || Esign.formatErrorMessage(e)
      });
    }
  };
}

window.Citeck = window.Citeck || {};
const EsignService = window.Citeck.Esign || new Esign();
window.Citeck.Esign = EsignService;

export { Esign };
export default EsignService;
