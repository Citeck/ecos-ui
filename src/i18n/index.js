import i18next from 'i18next';
import { getCurrentLocale } from '../helpers/util';

const loadKeys = async lang => {
  const module = await import(`../i18n/${lang}`);
  return module.default;
};

export function i18nInit() {
  const currentLocale = getCurrentLocale();

  return new Promise(resolve => {
    loadKeys(currentLocale).then(keys => {
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
