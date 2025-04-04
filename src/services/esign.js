import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import React from 'react';
import { createRoot } from 'react-dom/client';

import api from '../api/esign';
import EsignComponent from '../components/Esign';
import { ErrorTypes, Labels } from '../constants/esign';
import EsignConverter from '../dto/esign';
import { t, objectByString } from '../helpers/util';
import ConfigService, { ALFRESCO_ENABLED } from '../services/config/ConfigService';

class Esign {
  #root = null;

  static #queryParams = {};

  /**
   * @param recordRefs {string[]|string}
   * @param queryParams {boolean|object}
   * @returns {string[]}
   */
  static dataPreparation(recordRefs, queryParams) {
    let params;

    switch (typeof queryParams) {
      case 'boolean':
        params = { isApprovementSignature: queryParams };
        break;
      case 'object':
        params = queryParams instanceof Array ? {} : queryParams;
        break;
      default:
        params = {};
    }

    Esign.#queryParams = cloneDeep(params);

    if (!Array.isArray(recordRefs)) {
      recordRefs = [recordRefs];
    }

    return recordRefs;
  }

  /**
   * @param refs {string[]|string}
   * @param componentProps {object}
   * @param queryParams {boolean|object}
   */
  sign(refs, componentProps = {}, queryParams = false) {
    if (!refs) {
      return new Error(`The "recordRefs" argument is required`);
    }

    const recordRefs = Esign.dataPreparation(refs, queryParams);
    const container = document.createElement('div');

    this.#root = createRoot(container);
    this.#root.render(
      <EsignComponent
        recordRefs={recordRefs}
        {...componentProps}
        onClose={() => {
          this.#onClose(container);
        }}
      />
    );

    document.body.appendChild(container);
  }

  /* selects the certificate before the signing request in silentSign */
  selectCertificate() {
    return new Promise((resolve, _reject) => {
      const container = document.createElement('div');

      const handleSelectCert = selectedCertificate => {
        this.#onClose(container);

        return resolve(selectedCertificate);
      };

      this.#root = createRoot(container);
      this.#root.render(
        <EsignComponent
          handleSelectCert={handleSelectCert}
          recordRefs={['']}
          onClose={() => {
            this.#onClose(container);
          }}
        />
      );

      document.body.appendChild(container);
    });
  }

  /* document will be signed by the first found certificate */
  async silentSign(refs, componentProps = {}, queryParams = false, certificate = null) {
    if (!refs) {
      return new Error(`The "recordRefs" argument is required`);
    }

    const { onBeforeSigning, onSigned, onClose } = componentProps;

    const recordRefs = Esign.dataPreparation(refs, queryParams);

    if (isFunction(onBeforeSigning)) {
      await onBeforeSigning(recordRefs, certificate);
    }

    return Esign.signDocument(recordRefs, certificate).then(documentSigned => {
      if (documentSigned && documentSigned.success && isFunction(onSigned)) {
        onSigned();
      }

      if (isFunction(onClose)) {
        onClose();
      }
    });
  }

  #onClose = container => {
    this.#root?.unmount();
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

  static getCertificates = async thumbprints => {
    try {
      if (!api.cadespluginApi) {
        throw new Error('cadespluginApi is null');
      }

      const certificates = await Promise.all(
        (await api.getCertificates(thumbprints)).map(async function (certificate) {
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

      var hasAlfresco = null;
      if (document.indexOf('alfresco/') === 0 || document.indexOf('workspace://') === 0) {
        hasAlfresco = true;
      }
      if (hasAlfresco === null) {
        hasAlfresco = await ConfigService.getValue(ALFRESCO_ENABLED);
      }

      const documentResponse = await api.getDocumentData(document, hasAlfresco);
      const base64 = get(documentResponse, hasAlfresco ? 'data.0.base64' : 'records[0].data', '');

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

      const user = await get(window, 'Citeck.constants.USERNAME', '');
      const signResponse = await api.sendSignedDocument(
        EsignConverter.getSignQueryParams({ ...Esign.#queryParams, document, signedMessage, user }),
        hasAlfresco
      );

      return {
        document,
        signedMessage,
        documentResponse,
        base64,
        isVerified,
        success: hasAlfresco ? get(signResponse, 'data', false) : signResponse.success
      };
    } catch (e) {
      console.error('[EsignService signDocumentByNode] error ', e.message);

      return Promise.reject({
        messageTitle: t(Labels.EDS_ERROR),
        messageDescription: e.messageDescription || e.message || t(Labels.SIGN_FAILED_MESSAGE),
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

      const stringSignatures = signStatuses.filter(status => isString(status.success));
      isFunction(setSignatures) && setSignatures(stringSignatures);

      if (signStatuses.some(status => !status.success)) {
        return Promise.reject({
          messageTitle: t(Labels.ERROR),
          messageDescription: t(Labels.SIGN_FAILED_MESSAGE),
          errorType: t(ErrorTypes.DEFAULT),
          formattedError: Esign.formatErrorMessage(
            {
              notSignedDocuments: documents.filter((d, i) => !signStatuses[i].success)
            },
            t(Labels.ACTION_SIGN_DOCS)
          )
        });
      }

      return signStatuses;
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
