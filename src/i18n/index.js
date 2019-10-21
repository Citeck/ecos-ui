import i18next from 'i18next';
import { getCurrentLocale } from '../helpers/util';
import lodashSet from 'lodash/set';

const loadKeys = async lang => {
  // TODO group by modules
  const module = await import(`../i18n/${lang}`);
  return module.default;
};

export function i18nInit({ debug = false }) {
  const currentLocale = getCurrentLocale();

  return new Promise(resolve => {
    loadKeys(currentLocale).then(keys => {
      // TODO remove in future: see src/components/EcosForm/EcosFormUtils.js getI18n()
      lodashSet(window, 'Alfresco.messages.global', keys);

      i18next
        .init({
          lng: currentLocale,
          debug,
          keySeparator: false,
          resources: {
            [currentLocale]: {
              translation: keys
            }
          }
        })
        .then(resolve);
    });
  });
}
