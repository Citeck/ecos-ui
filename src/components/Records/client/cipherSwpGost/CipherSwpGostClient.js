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
    const assocAtts = [];
    for (let idx = 0; idx < attsToLoad.length; idx++) {
      let value = attsToLoad[idx];
      let encryptedAtt = this._getAsEncryptedAttOrFalse(value, config.attsToEncrypt);
      if (encryptedAtt) {
        attsToLoad[idx] = encryptedAtt + '|hex()';
        attsToEncryptIndexes.push(idx);
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
        assocAtts
      }
    };
  }

  async postProcessAtts(loadedAtts, clientAtts, config) {
    const { attsToEncryptIndexes } = config;

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

    return mkey ? { mkey: mkey.trim() } : null;
  }

  async prepareMutation(attributes, config) {
    if (config.mkey) {
      attributes.mkey = config.mkey;
    }
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
      return window.cadesplugin.async_spawn(function*() {
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

/*

var CAPICOM_CURRENT_USER_STORE = 2;
var CAPICOM_MY_STORE = "My";
var CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED = 2;
(function Decrypt() {

    cadesplugin.async_spawn(function* () {

        const keyData = {
            "key": "31 2E 32 2E 36 34 33 2E 37 2E 31 2E 32 2E 35 2E 31 2E 31:06 20 01 00 3D 2E 00 00 4D 41 47 31 00 04 00 00 30 20 06 09 2A 85 03 07 01 02 01 02 01 06 08 2A 85 03 07 01 01 02 03 06 09 2A 85 03 07 01 02 05 01 01 1E D4 30 80 BB 1D 21 38 90 63 49 2F 68 BF B0 D4 72 82 C3 51 9C FF 25 4D 49 D8 53 F8 A7 89 74 9A 1D 7D 1A 13 B0 62 2F 1E E8 E4 04 AC 17 33 EF 15 A2 88 AB C2 2F B7 2B B1 5C A8 67 DA 23 CD FA 6A 49 EB 23 4B 65 74 98 1A C6 E2 1D 33 71 A7 A7 C8 C6 E2 66 77 1C F5 EF 5C 3C 33 DD D5 24 48 6C BC 36 8F 09 37 9B E7 1D 3C 99 3D AA 38 A9 E5 2A ED 6F 07 16 AB BD B5 2A 9D 28 B5 16 49 20 9A 9F 1F:01 20 00 00 1E 66 00 00 FD 51 4A 37 1E 66 00 00 A6 C3 E0 B3 35 38 23 CD 07 C7 0D DD E7 65 66 03 CB 20 D4 1A BC 12 04 44 51 0A 34 06 C4 1A C7 2E BB 21 6E E9 94 24 5C EC CA 55 79 78 30 0B 06 09 2A 85 03 07 01 02 05 01 01",
            "thumbprint": "DC709501FA228077661E68C07BBF4096896A7BEE",
            "encryptedData": "D294EB812A36326E69A2D3B5423E1DA45404CE739D25AD7F243D6B4736395994AFBAEA98F4E27E413AF74CC57F563D26",
            "iv": "B6386FAB7ACFE5E7"
        };

        const oStore = yield cadesplugin.CreateObjectAsync("CAdESCOM.Store");
        yield oStore.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE, CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

        const allCertificates = yield oStore.Certificates;

        const filteredCertificates = yield allCertificates.Find(cadesplugin.CAPICOM_CERTIFICATE_FIND_SHA1_HASH, keyData.thumbprint);
        const filteredCertificatesCount = yield filteredCertificates.Count;

        if (filteredCertificatesCount === 0) {
            alert("Сертификат не найден " + keyData.thumbprint);
            return;
        }
        console.log("Найдено сертификатов по отпечатку: " + filteredCertificatesCount);

        for (let i = 1; i <= filteredCertificatesCount; i++) {
            const certificate = yield filteredCertificates.Item(i);
            console.log("Пробуем сертификат: " + (yield certificate.SubjectName));

            const oSymAlgo = yield cadesplugin.CreateObjectAsync("CAdESCOM.SymmetricAlgorithm");
            try {
                yield oSymAlgo.ImportKey(keyData.key, certificate);
                console.log("Ключ успешно импортирован");
                yield oSymAlgo.propset_IV(keyData.iv);

                const resultBase64 = yield oSymAlgo.Decrypt(keyData.encryptedData, 1);
                console.log(Base64.decode(resultBase64));
                break;
            } catch (e) {
                console.log("Сертификат не подошел", e);
            }
        }
    });
})()
*/
