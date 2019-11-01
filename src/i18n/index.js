import i18next from 'i18next';
import { getCurrentLocale } from '../helpers/util';
import lodashSet from 'lodash/set';
import lodashGet from 'lodash/get';
import { loadLegacyMessages } from '../legacy/share';

const loadKeys = async lang => {
  // TODO group by modules
  const module = await import(`../i18n/${lang}`);
  return module.default;
};

export function i18nInit({ debug = false, shouldLoadLegacyMessages = false }) {
  const currentLocale = getCurrentLocale();

  return new Promise(resolve => {
    loadKeys(currentLocale).then(keys => {
      // TODO remove in future
      const legacyMessagesPromise = shouldLoadLegacyMessages ? loadLegacyMessages : () => Promise.resolve();

      legacyMessagesPromise().then(() => {
        const allKeys = {
          ...lodashGet(window, 'Alfresco.messages.global', {}),
          ...keys
        };

        // see src/components/EcosForm/EcosFormUtils.js getI18n()
        const ecosFormsKeys = {};
        const ecosFormsKeysPrefix = 'ecos.forms.';
        for (let key in allKeys) {
          if (allKeys.hasOwnProperty(key) && key.indexOf(ecosFormsKeysPrefix) === 0) {
            ecosFormsKeys[key] = allKeys[key];
          }
        }
        lodashSet(window, 'Alfresco.messages.ecosForms', ecosFormsKeys);

        i18next
          .init({
            lng: currentLocale,
            debug,
            keySeparator: false,
            resources: {
              [currentLocale]: {
                translation: allKeys
              }
            }
          })
          .then(resolve);
      });
    });
  });
}
