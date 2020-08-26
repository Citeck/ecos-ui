import i18next from 'i18next';
import lodashSet from 'lodash/set';
import lodashGet from 'lodash/get';

import { getCurrentLocale } from '../helpers/util';
import { AppApi } from '../api/app';

export function i18nInit({ debug = false }) {
  const lng = getCurrentLocale();
  const promiseServer = AppApi.getDictionaryServer(lng);
  const promiseLocal = AppApi.getDictionaryLocal(lng);

  return Promise.allSettled([promiseServer, promiseLocal])
    .then(([server, local]) => ({
      ...lodashGet(local, 'value', {}),
      ...lodashGet(server, 'value', {})
    }))
    .then(translation => {
      const ecosForms = {}; // see src/components/EcosForm/EcosFormUtils.js getI18n()

      Object.keys(translation)
        .filter(key => key.indexOf('ecos.forms.') === 0)
        .forEach(key => (ecosForms[key] = translation[key]));

      lodashSet(window, 'Alfresco.messages.global', translation);
      lodashSet(window, 'Alfresco.messages.ecosForms', ecosForms);

      i18next
        .init({
          lng,
          debug,
          keySeparator: false,
          resources: {
            [lng]: { translation }
          }
        })
        .then(Promise.resolve);
    });
}
