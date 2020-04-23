export const URL_CONTEXT = '/share/';
export const PROXY_URI = '/share/proxy/alfresco/';
export const PROXY_URI_SHORT = '/share/proxy/';
export const MICRO_URI = `${PROXY_URI}citeck/micro/uiserv/`;
export const TASKS_URI = `${PROXY_URI}citeck/tasks/`;
export const URL_RESCONTEXT = '/share/res/';
export const URL_PAGECONTEXT = '/share/page/';
export const URL_SERVICECONTEXT = '/share/service/';
export const URL_EIS_CONFIG = '/eis.json';
export const COOKIE_KEY_LOCALE = 'alf_share_locale';
export const COOKIE_KEY_LOCALE_MAX_AGE = 30 * 24 * 60 * 60;
export const ALFRESCO = 'alfresco';

window.Alfresco = window.Alfresco || {};
window.Alfresco.constants = window.Alfresco.constants || {};
window.Alfresco.constants = {
  ...window.Alfresco.constants,
  URL_CONTEXT,
  PROXY_URI,
  PROXY_URI_SHORT,
  MICRO_URI,
  URL_RESCONTEXT,
  URL_PAGECONTEXT,
  URL_SERVICECONTEXT
};
