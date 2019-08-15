import { get, isEmpty, nth } from 'lodash';
import { LAYOUT_TYPE } from '../constants/layout';
import { t } from '../helpers/util';

export default class DashboardService {
  static defaultDashboardTab = idLayout => ({ label: t('Новая вкладка'), idLayout });

  static defaultDashboardConfig = {
    layout: {
      id: 'layout_0',
      tab: DashboardService.defaultDashboardTab('layout_0'),
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
      return [DashboardService.defaultDashboardConfig];
    }

    return result || [];
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

  static movedToListLayout(config, layouts) {
    if (isEmpty(layouts)) {
      console.log('movedToListLayout: for old version, which has one layout without tab');
      const layout = get(config, ['layout'], {});

      layout.id = 'layout_0';
      layout.tab = DashboardService.defaultDashboardConfig.layout.tab;

      if (!isEmpty(layout)) {
        layouts.push(layout);
      }
    }
  }
}
