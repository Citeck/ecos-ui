import CAPIWS from '../utils/capiws';
import { NotificationManager } from 'react-notifications';
import { t } from '../helpers/export/util';
import { AppApi } from './app';

const appApi = new AppApi();

const parseApiKeysConfig = configValue => {
  return (configValue || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

let apiKeysPromise = null;

const loadApiKeys = () => {
  if (!apiKeysPromise) {
    apiKeysPromise = appApi.getEcosConfig('eimzoApiKey').then(parseApiKeysConfig);

    apiKeysPromise.catch(() => {
      apiKeysPromise = null;
    });
  }

  return apiKeysPromise;
};

class EimzoEsignApi {
  hasActiveEimzo = () => {
    return new Promise(resolve => {
      CAPIWS.version(() => resolve(true), () => resolve(false));
    });
  };

  registerApiKey = async () => {
    const apiKeys = await loadApiKeys();

    return new Promise((resolve, reject) => {
      CAPIWS.apikey(
        apiKeys,
        (event, data) => {
          if (data.success) {
            resolve();
          } else {
            NotificationManager.error(data.reason, t('error'));
            reject(data.reason);
          }
        },
        error => reject(error)
      );
    });
  };

  getUSBTokens() {
    return new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          plugin: 'ckc',
          name: 'list_ckc'
        },
        (event, data) => resolve(data.devices),
        error => reject(error)
      );
    });
  }

  getAllCertificates() {
    return new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          plugin: 'pfx',
          name: 'list_all_certificates'
        },
        (event, data) => resolve(data.certificates),
        error => reject(error)
      );
    });
  }

  getPfxPrivateKey(certificateData) {
    return new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          plugin: 'pfx',
          name: 'load_key',
          arguments: [certificateData.disk, certificateData.path, certificateData.name, certificateData.alias]
        },
        (event, data) => resolve(data),
        error => reject(error)
      );
    });
  }

  getSignedDocument(keyId, base64) {
    return new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          plugin: 'pkcs7',
          name: 'create_pkcs7',
          arguments: [base64, keyId, 'no']
        },
        (event, data) => {
          resolve(data);
        },
        error => reject(error)
      );
    });
  }

  // Пока не используем. Требует ввода пароля для каждого сертификата. Эти данные можно достать из alias, который пароля не требует.
  // Здесь из полезного относительно alias только данные об Issuer
  getCertificateInfo(certificate_64) {
    return new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          plugin: 'x509',
          name: 'get_certificate_info',
          arguments: [certificate_64]
        },
        (event, data) => resolve(data),
        error => reject(error)
      );
    });
  }

  //Пока не используем. Понадобится если начнем использовать getCertificateInfo
  getCertificateChain(pfxPrivateKey) {
    return new Promise((resolve, reject) => {
      CAPIWS.callFunction(
        {
          plugin: 'x509',
          name: 'get_certificate_chain',
          arguments: [pfxPrivateKey.keyId]
        },
        (event, data) => resolve(data),
        error => reject(error)
      );
    });
  }
}

export default new EimzoEsignApi();
