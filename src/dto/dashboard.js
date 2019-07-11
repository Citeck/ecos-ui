import { isEmpty } from 'lodash';
import { QueryKeys } from '../constants';
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
  if (isEmpty(source)) {
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
  if (isEmpty(source)) {
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
  if (isEmpty(result)) {
    return {};
  }

  return result[QueryKeys.CONFIG_JSON] || {};
}

export function parseSaveResult(result) {
  if (isEmpty(result)) {
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
