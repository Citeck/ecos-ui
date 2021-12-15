import i18next from 'i18next';
import lodashSet from 'lodash/set';

import { getCurrentLocale } from '../helpers/util';
import { AppApi } from '../api/app';
import { LANGUAGE_EN } from '../constants/lang';

export function i18nInit({ debug = false }) {
  const lng = getCurrentLocale();
  const promiseServer = AppApi.getDictionaryServer(lng);
  const promiseLocal = AppApi.getDictionaryLocal(lng);

  return Promise.all([promiseServer, promiseLocal])
    .then(([server, local]) => ({
      ...(local || {}),
      ...(server || {})
    }))
    .then(translation => {
      const ecosForms = {}; // see src/components/EcosForm/EcosFormUtils.js getI18n()

      Object.keys(translation)
        .filter(key => key.indexOf('ecos.forms.') === 0)
        .forEach(key => (ecosForms[key] = translation[key]));

      lodashSet(window, 'Citeck.messages.global', translation);
      lodashSet(window, 'Citeck.messages.ecosForms', ecosForms);

      i18next
        .init({
          fallbackLng: LANGUAGE_EN,
          lng,
          debug,
          keySeparator: false,
          resources: {
            [lng]: { translation }
          }
        })
        .then(r => r);
    });
}
