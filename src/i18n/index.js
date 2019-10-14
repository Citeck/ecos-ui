import i18next from 'i18next';
import { getCurrentLocale } from '../helpers/util';
import lodashSet from 'lodash/set';

const loadKeys = async lang => {
  const module = await import(`../i18n/${lang}`);
  return module.default;
};

export function i18nInit() {
  const currentLocale = getCurrentLocale();

  return new Promise(resolve => {
    loadKeys(currentLocale).then(keys => {
      // TODO remove in future: see src/components/EcosForm/EcosFormUtils.js getI18n()
      lodashSet(window, 'Alfresco.messages.global', keys);

      i18next
        .init({
          lng: currentLocale,
          debug: process.env.NODE_ENV === 'development',
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
