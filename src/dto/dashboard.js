import { QUERY_KEYS } from '../constants';

export function getDashboardForWeb(source) {
  const { layout } = source;
  let target = {};

  target.columns = layout.columns;

  return target;
}

export function parseGetResult(result) {
  if (!result || (result && !Object.keys(result).length)) {
    return {};
  }

  return result[QUERY_KEYS.CONFIG_JSON];
}

export function parseSaveResult(result) {
  if (!result || (result && !Object.keys(result).length)) {
    return;
  }

  const DIV = '@';
  const fullId = result._id || '';
  const recordId = fullId && fullId.indexOf(DIV) >= 0 ? fullId.split(DIV)[1] : null;

  return {
    recordId
  };
}
