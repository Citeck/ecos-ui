export const SOURCE_DELIMITER = '@';

/** Source id of the resolved-type records source (was `SourcesId.RESOLVED_TYPE`). */
export const RESOLVED_TYPE_SOURCE_ID = 'emodel/rtype';

/** Storage key for the records-api debug feature flag (was in DevTools constants). */
export const SETTING_ENABLE_RECORDS_API_DEBUG = 'enableRecordsApiDebug';

const BASE_URL = '/gateway/api/records/';
export const QUERY_URL = `${BASE_URL}query`;
export const DELETE_URL = `${BASE_URL}delete`;
export const MUTATE_URL = `${BASE_URL}mutate`;

export const ASSOC_DEFAULT_INNER_SCHEMA = '{disp:?disp,value:?assoc}';

export const PERMISSION_WRITE_ATTR = 'permissions._has.Write?bool!true';
export const IS_CONTENT_PROTECTED_ATTR = '_edge._content.protected?bool!';
export const PERMISSION_CHANGE_PASSWORD = 'permissions._has.CHANGE_PASSWORD?bool!';
