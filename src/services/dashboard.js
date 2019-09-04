import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import nth from 'lodash/nth';
import split from 'lodash/split';
import includes from 'lodash/includes';
import uuid from 'uuidv4';
import { LAYOUT_TYPE } from '../constants/layout';
import { SourcesId } from '../constants';
import { t } from '../helpers/util';

const separatorId = '@';

export default class DashboardService {
  static SaveWays = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    CONFIRM: 'CONFIRM'
  };

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

  static formShortId(id) {
    if (includes(id, separatorId)) {
      return nth(split(id, separatorId), 1);
    }

    return id;
  }

  static formFullId(id) {
    return `${SourcesId.DASHBOARD}${separatorId}${DashboardService.formShortId(id)}`;
  }

  static checkDashboardResult(result) {
    if (isEmpty(result)) {
      return [DashboardService.defaultDashboardConfig(DashboardService.newIdLayout)];
    }

    return result || [];
  }

  static parseRequestResult(result) {
    if (isEmpty(result)) {
      return {};
    }

    const fullId = result._id || '';
    const dashboardId = DashboardService.formShortId(fullId);

    return {
      dashboardId
    };
  }

  static defineWaySavingDashboard(eqKey, allUser, hasUser) {
    switch (true) {
      case eqKey && !allUser && !hasUser:
        return DashboardService.SaveWays.CREATE;
      case eqKey && !allUser && hasUser:
      case eqKey && allUser && !hasUser:
        return DashboardService.SaveWays.UPDATE;
      case !eqKey || (eqKey && allUser && hasUser):
      default:
        return DashboardService.SaveWays.CONFIRM;
    }
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

  static generateMobileConfig(source = []) {
    const mobile = [];

    source.forEach(layout => {
      const { id: idLayout, columns, tab } = layout;

      mobile.push({
        id: idLayout,
        tab: { label: tab.label, idLayout },
        type: LAYOUT_TYPE.MOBILE,
        columns: [
          {
            widgets: columns.reduce((result, current) => [...result, ...current.widgets], [])
          }
        ]
      });
    });

    return mobile;
  }
}
