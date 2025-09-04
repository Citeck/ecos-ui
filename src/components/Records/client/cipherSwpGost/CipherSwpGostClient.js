import { Base64 } from 'js-base64';
import RecordsClient from '../RecordsClient';
import { ASSOC_DEFAULT_INNER_SCHEMA } from '../../constants';
import _ from 'lodash';
import { t } from '../../../../helpers/util';

const CAPICOM_CURRENT_USER_STORE = 2;
const CAPICOM_MY_STORE = 'My';
const CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;

const CIPHER_KEYS_ALIAS = '__cipher_gost_keys';
const CIPHER_MKEY_ALIAS = '__cipher_mkey';

let pluginEnabled = null;

export default class CipherSwpGostClient extends RecordsClient {
  constructor() {
    super();
    this._certsCache = {};
  }

  init(records) {
    this._records = records;
  }

  async preProcessAtts(attsToLoad, config) {
    if (pluginEnabled === false || !config.attsToEncrypt || config.attsToEncrypt.length === 0) {
      return null;
    }
    if (pluginEnabled == null) {
      try {
        await window.cadesplugin;
        pluginEnabled = true;
      } catch (e) {
        pluginEnabled = false;
        console.warn(t('cipher-swp-gost.missing-plugin'));
        return null;
      }
    }
    const attsToEncryptIndexes = [];
    const attsToEncryptNames = [];
    const assocAtts = [];
    for (let idx = 0; idx < attsToLoad.length; idx++) {
      let value = attsToLoad[idx];
      let encryptedAtt = this._getAsEncryptedAttOrFalse(value, config.attsToEncrypt);
      if (encryptedAtt) {
        attsToLoad[idx] = encryptedAtt + '|hex()';
        attsToEncryptIndexes.push(idx);
        attsToEncryptNames.push(encryptedAtt);
        if (value === encryptedAtt + ASSOC_DEFAULT_INNER_SCHEMA) {
          assocAtts.push(idx);
        }
      }
    }
    if (!attsToEncryptIndexes.length) {
      return null;
    }
    return {
      clientAtts: {
        [CIPHER_KEYS_ALIAS]: '_cipher.keys{wrappedKey._as.sym-key-blobs,certThumbprint|hex(" ")}',
        [CIPHER_MKEY_ALIAS]: 'mkey|hex()'
      },
      config: {
        attsToEncryptIndexes,
        attsToEncryptNames,
        assocAtts
      }
    };
  }

  async postProcessAtts(loadedAtts, clientAtts, config) {
    const { attsToEncryptIndexes, attsToEncryptNames } = config;

    const key = clientAtts[CIPHER_KEYS_ALIAS];
    if (!key || !key.certThumbprint || !key.wrappedKey) {
      return null;
    }
    let certificates;
    if (!window.cadesplugin) {
      certificates = [];
      console.warn('You should install CryptoPRO browser plugin to work with Cipher SWP GOST records');
    } else {
      certificates = await this._findCerts(key.certThumbprint);
    }
    if (certificates.length === 0) {
      for (let encryptedAttIdx of attsToEncryptIndexes) {
        loadedAtts[encryptedAttIdx] = null;
      }
      return null;
    }

    let symAlgAllowed = true;

    let encryptedAttNameIdx = 0;
    const decryptedAttsByName = {};
    for (let encryptedAttIdx of attsToEncryptIndexes) {
      let value = loadedAtts[encryptedAttIdx];
      if (symAlgAllowed) {
        const symAlg = await this._createSymAlg(key.wrappedKey, certificates);
        if (symAlg) {
          value = await this._decrypt(symAlg, value);
        } else {
          value = null;
          symAlgAllowed = false;
        }
      } else {
        value = null;
      }
      loadedAtts[encryptedAttIdx] = value;
      decryptedAttsByName[attsToEncryptNames[encryptedAttNameIdx++]] = value;
    }

    for (let assocAttIdx of config.assocAtts) {
      const value = loadedAtts[assocAttIdx];
      if (value && _.isString(value)) {
        loadedAtts[assocAttIdx] = await this._records.get(value).load({ value: '?assoc', disp: '?disp' });
      }
    }

    let mkey = clientAtts[CIPHER_MKEY_ALIAS];
    if (mkey && symAlgAllowed) {
      const symAlg = await this._createSymAlg(key.wrappedKey, certificates);
      mkey = await this._decryptBase64(symAlg, mkey);
    } else {
      mkey = null;
    }

    return mkey
      ? {
          mkey: mkey.trim(),
          decryptedAttsByName
        }
      : null;
  }

  async prepareMutation(attributes, config) {
    if (!config.mkey) {
      return;
    }
    const simplifiedAttNames = {};
    for (let attName in attributes) {
      let qIdx = attName.indexOf('?');
      if (qIdx > 0) {
        simplifiedAttNames[attName.substring(0, qIdx)] = attName;
      } else {
        simplifiedAttNames[attName] = attName;
      }
    }
    for (let decryptedAttKey in config.decryptedAttsByName) {
      if (!simplifiedAttNames.hasOwnProperty(decryptedAttKey)) {
        attributes[decryptedAttKey] = config.decryptedAttsByName[decryptedAttKey];
      }
    }
    attributes.mkey = config.mkey;
  }

  isPersisted(config) {
    return !config.mkey;
  }

  async _findCerts(thumbprint) {
    let certs = this._certsCache[thumbprint];
    if (!certs) {
      certs = this._findCertsImpl(thumbprint).then(findRes => {
        this._certsCache[thumbprint] = findRes;
        return findRes;
      });
      this._certsCache[thumbprint] = certs;
    }
    return certs;
  }

  async _findCertsImpl(thumbprint) {
    return window.cadesplugin.async_spawn(function*() {
      const oStore = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.Store');
      yield oStore.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE, CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

      const allCertificates = yield oStore.Certificates;

      const filteredCertificates = yield allCertificates.Find(window.cadesplugin.CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint);
      const filteredCertificatesCount = yield filteredCertificates.Count;

      if (filteredCertificatesCount === 0) {
        return [];
      }

      const result = [];
      for (let i = 1; i <= filteredCertificatesCount; i++) {
        result.push(yield filteredCertificates.Item(i));
      }
      return result;
    });
  }

  async _createSymAlg(key, certificates) {
    return window.cadesplugin.async_spawn(function*() {
      const symAlg = yield window.cadesplugin.CreateObjectAsync('CAdESCOM.SymmetricAlgorithm');
      yield symAlg.propset_LegacyPluginSymmetricExport(true);

      let certWasFound = false;

      for (let cert of certificates) {
        try {
          yield symAlg.ImportKey(key, cert);
          certWasFound = true;
          break;
        } catch (e) {
          console.log("Key import failed with certificate: '" + (yield cert.SubjectName) + "'", e);
        }
      }
      return certWasFound ? symAlg : null;
    });
  }

  async _decrypt(symAlg, encryptedData) {
    try {
      const decryptedBase64 = await this._decryptBase64(symAlg, encryptedData);
      return JSON.parse(Base64.decode(decryptedBase64));
    } catch (e) {
      console.error("Attribute can't be decrypted", e);
      return null;
    }
  }

  async _decryptBase64(symAlg, encryptedData) {
    if (!encryptedData || encryptedData.length <= 8) {
      return encryptedData;
    }

    const iv = encryptedData.substring(0, 16);
    const data = encryptedData.substring(16);

    try {
      return await window.cadesplugin.async_spawn(function*() {
        yield symAlg.propset_IV(iv);
        return yield symAlg.Decrypt(data, 1);
      });
    } catch (e) {
      console.error("Attribute can't be decrypted", e);
      return null;
    }
  }

  _getAsEncryptedAttOrFalse = (att, attsToEncrypt) => {
    for (let encryptedAtt of attsToEncrypt) {
      if (att === encryptedAtt) {
        return encryptedAtt;
      }
      if (att.length > encryptedAtt.length) {
        if (att.indexOf(encryptedAtt) === 0) {
          let ch = att[encryptedAtt.length];
          if (ch === '.' || ch === '?' || ch === '{') {
            return encryptedAtt;
          }
        } else {
          if (att.startsWith('.att(n:"' + encryptedAtt + '"') || att.startsWith('.atts(n:"' + encryptedAtt + '"')) {
            return encryptedAtt;
          }
        }
      }
    }
    return false;
  };

  getType() {
    return 'cipher-swp-gost';
  }
}

