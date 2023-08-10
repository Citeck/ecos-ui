import React from 'react';
import ReactDOM from 'react-dom';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isString from 'lodash/isFunction';
import isFunction from 'lodash/isFunction';

import api from '../api/esign';
import EsignComponent from '../components/Esign';
import EsignConverter from '../dto/esign';
import { ErrorTypes, Labels } from '../constants/esign';
import { objectByString, t } from '../helpers/util';

class Esign {
  static #queryParams = {};

  sign(recordRefs, componentProps = {}, queryParams = false) {
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
  }

  #onClose = container => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  };

  get isApiReady() {
    return api.hasCadesplugin;
  }

  static init = async (recordRefs = []) => {
    try {
      if (!recordRefs.length) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NODE_REF_NOT_FOUND),
          errorType: t(ErrorTypes.DEFAULT)
        });
      }

      if (api.cadespluginApi) {
        return api.cadespluginApi;
      }

      return await api.getCadespluginApi();
    } catch (e) {
      const hasPlugin = api.hasCadesplugin;

      console.error('[EsignService init] error ', e.message);

      return Promise.reject({
        messageTitle: hasPlugin ? t(Labels.EDS_ERROR) : t(Labels.ADD_PLUGIN),
        messageDescription: hasPlugin ? e.message : t(Labels.ADD_PLUGIN_MESSAGE),
        errorType: hasPlugin ? t(ErrorTypes.DEFAULT) : t(ErrorTypes.NO_CADESPLUGIN),
        formattedError: e.formattedError || Esign.formatErrorMessage(e)
      });
    }
  };

  static getCertificates = async () => {
    try {
      if (!api.cadespluginApi) {
        throw new Error('cadespluginApi is null');
      }

      const certificates = await Promise.all(
        (await api.getCertificates()).map(async function(certificate) {
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
      const hasPlugin = api.hasCadesplugin;

      console.error('[EsignService getCertificates] error ', e.message);

      return Promise.reject({
        messageTitle: hasPlugin ? t(Labels.EDS_ERROR) : t(Labels.ADD_PLUGIN),
        messageDescription: hasPlugin ? e.message : t(Labels.ADD_PLUGIN_MESSAGE),
        errorType: hasPlugin ? t(ErrorTypes.DEFAULT) : t(ErrorTypes.NO_CADESPLUGIN),
        formattedError: e.formattedError || Esign.formatErrorMessage(e)
      });
    }
  };

  static formatErrorMessage = (error, action) => {
    return objectByString({ action: action ? t(Labels.ACTION, { action }) : '', ...error });
  };

  static signDocumentByNode = async (thumbprint, document) => {
    try {
      if (!thumbprint) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_CERTIFICATE_THUMBPRINT_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT),
          formattedError: Esign.formatErrorMessage({}, t(Labels.ACTION_CHECK_THUMB))
        });
      }

      const documentResponse = await api.getDocumentData(document);
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

      const signedMessage = await api.getSignedDocument(thumbprint, base64);
      const isVerified = await api.verifySigned(signedMessage, base64);

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
      const signResponse = await api.sendSignedDocument(
        EsignConverter.getSignQueryParams({ ...Esign.#queryParams, document, signedMessage, user })
      );

      return get(signResponse, 'data', false);
    } catch (e) {
      console.error('[EsignService signDocumentByNode] error ', e.message);

      return Promise.reject({
        messageTitle: t(Labels.EDS_ERROR),
        messageDescription: e.messageDescription || t(Labels.SIGN_FAILED_MESSAGE),
        errorType: t(ErrorTypes.DEFAULT),
        formattedError: e.formattedError || Esign.formatErrorMessage(e)
      });
    }
  };

  static signDocument = async (documents = [], certificate = null, setSignatures) => {
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
        documents.map(async document => await Esign.signDocumentByNode(certificate.thumbprint, document))
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
}

window.Citeck = window.Citeck || {};
const EsignService = window.Citeck.Esign || new Esign();
window.Citeck.Esign = EsignService;

export { Esign };
export default EsignService;
