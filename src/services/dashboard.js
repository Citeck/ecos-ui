import { isEmpty, nth } from 'lodash';
import { LAYOUT_TYPE } from '../constants/layout';

export default class DashboardService {
  static defaultDashboardConfig = {
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

  static parseDashboardId(fullId) {
    if (fullId.includes('@')) {
      return nth(fullId.split('@'), 1);
    }

    return fullId;
  }

  static checkDashboardResult(result) {
    if (isEmpty(result)) {
      return DashboardService.defaultDashboardConfig;
    }

    return result || {};
  }

  static parseSaveResult(result) {
    if (isEmpty(result)) {
      return {};
    }

    const fullId = result._id || '';
    const dashboardId = DashboardService.parseDashboardId(fullId);

    return {
      dashboardId,
      fullId
    };
  }
}
