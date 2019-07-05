import { QUERY_KEYS } from '../constants';
import { LAYOUT_TYPE } from '../constants/layout';

export const getDefaultDashboardConfig = {
  layout: {
    type: LAYOUT_TYPE.TWO_COLUMNS_BS,
    columns: [
      {
        width: '30%',
        widgets: []
      },
      {
        widgets: []
      }
    ]
  }
};

export function getDashboardForWeb(source) {
  if (!source || (source && !Object.keys(source).length)) {
    return {};
  }

  const { layout, dashboardKey, dashboardId } = source;
  const target = {};

  target.dashboardKey = dashboardKey;
  target.dashboardId = dashboardId;
  target.columns = layout.columns;
  target.type = layout.type;

  return target;
}

export function getDashboardForServer(source) {
  if (!source || (source && !Object.keys(source).length)) {
    return {};
  }

  const {
    config: { columns, type },
    dashboardId
  } = source;

  return {
    config: {
      layout: { columns, type }
    },
    dashboardId
  };
}

export function parseGetResult(result) {
  if (!result || (result && !Object.keys(result).length)) {
    return {};
  }

  return result[QUERY_KEYS.CONFIG_JSON] || {};
}

export function parseSaveResult(result) {
  if (!result || (result && !Object.keys(result).length)) {
    return {};
  }

  const DIV = '@';
  const fullId = result._id || '';
  const dashboardId = fullId && fullId.indexOf(DIV) >= 0 ? fullId.split(DIV)[1] : null;

  return {
    dashboardId,
    fullId
  };
}
