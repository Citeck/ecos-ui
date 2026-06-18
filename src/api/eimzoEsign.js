import CAPIWS from '../utils/capiws';
import { NotificationManager } from 'react-notifications';
import { t } from '../helpers/export/util';

const API_KEYS = [
  'localhost',
  '96D0C1491615C82B9A54D9989779DF825B690748224C2B04F500F370D51827CE2644D8D4A82C18184D73AB8530BB8ED537269603F61DB0D03D2104ABF789970B',
  '127.0.0.1',
  'A7BCFA5D490B351BE0754130DF03A068F855DB4333D43921125B9CF2670EF6A40370C646B90401955E1F7BC9CDBF59CE0B2C5467D820BE189C845D0B79CFC96F'
];

class EimzoEsignApi {
  hasActiveEimzo = () => {
    return new Promise(resolve => {
      CAPIWS.version(() => resolve(true), () => resolve(false));
    });
  };

  registerApiKey = () => {
    return new Promise((resolve, reject) => {
      CAPIWS.apikey(
        API_KEYS,
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
