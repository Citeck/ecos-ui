export const SOURCE_DELIMITER = '@';
export const APP_DELIMITER = '/';

export const QUERY_URL = '/share/proxy/alfresco/citeck/ecos/records/query';
export const DELETE_URL = '/share/proxy/alfresco/citeck/ecos/records/delete';
export const MUTATE_URL = '/share/proxy/alfresco/citeck/ecos/records/mutate';

export const GATEWAY_URL_MAP = {
  [QUERY_URL]: '/share/api/records/query',
  [MUTATE_URL]: '/share/api/records/mutate',
  [DELETE_URL]: '/share/api/records/delete'
};
