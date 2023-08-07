export const SOURCE_DELIMITER = '@';

const BASE_URL = '/gateway/api/records/';
export const QUERY_URL = `${BASE_URL}query`;
export const DELETE_URL = `${BASE_URL}delete`;
export const MUTATE_URL = `${BASE_URL}mutate`;

export const ASSOC_DEFAULT_INNER_SCHEMA = '{disp:?disp,value:?assoc}';

export const PERMISSION_WRITE_ATTR = 'permissions._has.Write?bool!true';
export const PERMISSION_CHANGE_PASSWORD = 'permissions._has.CHANGE_PASSWORD?bool!';
