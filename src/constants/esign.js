export const ErrorTypes = {
  DEFAULT: 'default',
  NO_CADESPLUGIN: 'no-cadesplugin',
  SIGNED: 'signed',
  NO_CERTIFICATES: 'no-certificates'
};

export const DocStatuses = {
  SIGNING: 'signing',
  COUNTERPARTY_SIGNING: 'counterparty-signing'
};

export const Labels = {
  ERROR: 'Ошибка',
  ADD_PLUGIN: 'Установите расширение',
  ADD_PLUGIN_MESSAGE: 'Чтобы продолжить, установите расширение Cryptopro для браузера с сайта cryptopro.ru',
  NO_CERTIFICATES_MESSAGE: '',
  NO_BASE64_DOC_MESSAGE: 'Не удалось получить документ в формате base64',
  NO_CERTIFICATE_THUMBPRINT_MESSAGE: 'Не удалось получить информацию о сертификате',
  SIGN_FAILED_VERIFICATION_MESSAGE: 'Подпись не прошла проверку',
  SIGN_FAILED_MESSAGE: 'Во время подписания документа произошла ошибка'
};
