import { MENU_TYPE, QUERY_KEYS } from '../constants';

export function parseGetResult(result) {
  if (!result || (result && !Object.keys(result).length)) {
    return {};
  }

  return result[QUERY_KEYS.VALUE_JSON] || getDefaultMenuConfig;
}

export const getDefaultMenuConfig = {
  menu: {
    type: MENU_TYPE.TOP,
    links: []
  }
};
