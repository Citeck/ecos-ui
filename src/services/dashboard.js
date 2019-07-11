import { isEmpty } from 'lodash';
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
    const dashboardId = fullId && fullId.indexOf(DIV) >= 0 ? fullId.split(DIV)[1] : null;

    return {
      dashboardId,
      fullId
    };
  }
}
