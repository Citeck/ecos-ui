import React from 'react';
import ReactDOM from 'react-dom';
import get from 'lodash/get';

import api from '../api/esign';
import EsignWidget from '../components/Esign';
import EsignConverter from '../dto/esign';
import { ErrorTypes, Labels } from '../constants/esign';
import { t } from '../helpers/util';

export default class EsignService {
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

      const cadespluginApi = await api.getCadespluginApi();

      return cadespluginApi;
    } catch (e) {
      const hasPlugin = api.hasCadesplugin;

      console.error('[EsignService init] error ', e.message);

      return Promise.reject({
        messageTitle: hasPlugin ? t(Labels.ERROR) : t(Labels.ADD_PLUGIN),
        messageDescription: hasPlugin ? e.message : t(Labels.ADD_PLUGIN_MESSAGE),
        errorType: hasPlugin ? t(ErrorTypes.DEFAULT) : t(ErrorTypes.NO_CADESPLUGIN)
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
          messageDescription: ''
        });
      }

      return certificates;
    } catch (e) {
      const hasPlugin = api.hasCadesplugin;

      console.error('[EsignService getCertificates] error ', e.message);

      return Promise.reject({
        messageTitle: hasPlugin ? t(Labels.ERROR) : t(Labels.ADD_PLUGIN),
        messageDescription: hasPlugin ? e.message : t(Labels.ADD_PLUGIN_MESSAGE),
        errorType: hasPlugin ? t(ErrorTypes.DEFAULT) : t(ErrorTypes.NO_CADESPLUGIN)
      });
    }
  };

  static signDocumentByNode = async (thumbprint, document) => {
    try {
      if (!thumbprint) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_CERTIFICATE_THUMBPRINT_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        });
      }

      const documentResponse = await api.getDocumentData(document);
      const base64 = get(documentResponse, 'data.0.base64', '');

      if (!base64) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.NO_BASE64_DOC_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        });
      }

      const signedMessage = await api.getSignedDocument(thumbprint, base64);
      const isVerified = await api.verifySigned(signedMessage, base64);

      if (!isVerified) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.SIGN_FAILED_VERIFICATION_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        });
      }

      const user = await get(window, 'Alfresco.constants.USERNAME', '');
      const signResponse = await api.sendSignedDocument(document, signedMessage, user);

      return get(signResponse, 'data', false);
    } catch (e) {
      console.error('[EsignService signDocumentByNode] error ', e.message);

      return Promise.reject({
        messageTitle: t(Labels.ERROR),
        messageDescription: t(Labels.SIGN_FAILED_MESSAGE),
        errorType: t(ErrorTypes.DEFAULT)
      });
    }
  };

  static signDocument = async (documents = [], certificate = null) => {
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
        documents.map(async document => await EsignService.signDocumentByNode(certificate.thumbprint, document))
      );

      if (signStatuses.includes(false)) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.SIGN_FAILED_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT)
        });
      }

      return true;
    } catch (e) {
      console.error('[EsignService signDocument] error ', e.message);

      return Promise.reject({
        messageTitle: t(Labels.ERROR),
        messageDescription: t(Labels.SIGN_FAILED_MESSAGE),
        errorType: t(ErrorTypes.DEFAULT)
      });
    }
  };
}

class Esign {
  container = null;
  widget = null;

  sign = (recordRefs, params = {}) => {
    const keys = Object.keys({ recordRefs, ...params });
    let requireProps = ['recordRefs'];

    requireProps = requireProps.filter(key => !keys.includes(key));

    if (requireProps.length) {
      return new Error(`Required params [${requireProps.join(', ')}] not found`);
    }

    if (this.container === null) {
      this.container = document.createElement('div');
    }

    this.widget = ReactDOM.render(<EsignWidget recordRefs={recordRefs} {...params} onClose={this.close} />, this.container);

    document.body.appendChild(this.container);

    return this;
  };

  close = () => {
    ReactDOM.unmountComponentAtNode(this.container);

    return this;
  };

  apiIsReady = () => {
    return api.hasCadesplugin;
  };
}

window.Citeck = window.Citeck || {};

if (!window.Citeck.Esign) {
  const esign = new Esign();

  window.Citeck.Esign = {
    init: api.getCadespluginApi,
    sign: esign.sign,
    close: esign.close,
    get apiIsReady() {
      return esign.apiIsReady();
    }
  };
}
