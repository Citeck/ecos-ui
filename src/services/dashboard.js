import { isEmpty, last } from 'lodash';
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

  static processDashboardResult(result) {
    if (isEmpty(result)) {
      return DashboardService.defaultDashboardConfig;
    }

    return result || {};
  }

  static parseSaveResult(result) {
    if (isEmpty(result)) {
      return {};
    }

    const DIV = '@';
    const fullId = result._id || '';
    const dashboardId = last(fullId.split('@'));

    return {
      dashboardId,
      fullId
    };
  }
}
