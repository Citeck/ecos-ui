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
  SIGN_FAILED_MESSAGE: 'Во время подписания документа произошла ошибка',

  MODAL_TITLE: 'Выбор сертификата для подписи',
  MODAL_ALREADY_SIGNED_TITLE: 'Документ уже был подписан',
  MODAL_NO_CERTIFICATES_TITLE: 'Нет доступных сертификатов',
  MODAL_INSTALL_EXTENSION_TITLE: 'Установите расширение',
  MODAL_INSTALL_EXTENSION_DESCRIPTION: 'Чтобы продолжить, установите расширение КриптоПро для браузера с сайта cryptopro.ru',

  GO_TO_PLUGIN_PAGE_BTN: 'Перейти на страницу установки',
  OK_BTN: 'OK',
  SIGN_BTN: 'Подписать',
  CANCEL_BTN: 'Отмена',

  MODAL_CERTIFICATE_PROPERTIES: 'Свойства сертификата',
  MODAL_SUBJECT: 'Объект',
  MODAL_ISSUER: 'Издатель',
  MODAL_DATE_FROM: 'Дата создания',
  MODAL_DATE_TO: 'Действителен до',
  MODAL_PROVIDER: 'Поставщик',

  NO_DATA: 'Нет данных'
};

export const PLUGIN_URL = 'https://www.cryptopro.ru/products/cades/plugin';
