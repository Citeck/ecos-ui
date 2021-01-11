import { PROXY_URI } from '../../constants/alfresco';

export const SOURCE_DELIMITER = '@';
export const APP_DELIMITER = '/';

export const QUERY_URL = `${PROXY_URI}citeck/ecos/records/query`;
export const DELETE_URL = `${PROXY_URI}citeck/ecos/records/delete`;
export const MUTATE_URL = `${PROXY_URI}citeck/ecos/records/mutate`;

export const GATEWAY_URL_MAP = {
  [QUERY_URL]: '/gateway/api/records/query',
  [MUTATE_URL]: '/gateway/api/records/mutate',
  [DELETE_URL]: '/gateway/api/records/delete'
};
