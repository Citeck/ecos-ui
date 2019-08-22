import { get, isEmpty, nth } from 'lodash';
import { LAYOUT_TYPE } from '../constants/layout';
import { t } from '../helpers/util';
import uuid from 'uuidv4';

export default class DashboardService {
  static get newIdLayout() {
    return `layout_${uuid()}`;
  }

  static defaultDashboardTab = idLayout => ({ label: t('Вкладка'), idLayout });

  static defaultDashboardConfig = idLayout => ({
    layout: {
      id: idLayout,
      tab: DashboardService.defaultDashboardTab(idLayout),
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
  });

  static parseDashboardId(fullId) {
    if (fullId.includes('@')) {
      return nth(fullId.split('@'), 1);
    }

    return fullId;
  }

  static checkDashboardResult(result) {
    if (isEmpty(result)) {
      return [DashboardService.defaultDashboardConfig(DashboardService.newIdLayout)];
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

      layout.id = DashboardService.newIdLayout;
      layout.tab = DashboardService.defaultDashboardTab(layout.id);

      if (!isEmpty(layout)) {
        layouts.push(layout);
      }
    }
  }
}
