export const PROXY_URI = '/gateway/alfresco/alfresco/s/';
export const MICRO_URI = '/gateway/uiserv/';
export const TASKS_URI = `${PROXY_URI}citeck/tasks/`;
export const URL_PAGECONTEXT = '/share/page/';
export const URL_EIS_CONFIG = '/eis.json';
export const COOKIE_KEY_LOCALE = 'alf_share_locale';
export const COOKIE_KEY_LOCALE_MAX_AGE = 30 * 24 * 60 * 60;
export const ALFRESCO = 'alfresco';
export const UISERV_API = '/gateway/uiserv/api/';

window.Alfresco = window.Alfresco || {};
window.Alfresco.constants = window.Alfresco.constants || {};

window.Alfresco.constants = {
  PROXY_URI,
  MICRO_URI,
  ...window.Alfresco.constants
};

/**
 * WARNING: This file imported in some files which are exported to the old UI (e.g. EcosForm)
 * Be careful when you add new dependencies here!
 */
