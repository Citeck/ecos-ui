import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import uuid from 'uuidv4';

import { SourcesId } from '../constants';
import { CONFIG_VERSION } from '../constants/dashboard';
import { LayoutTypes } from '../constants/layout';
import { t } from '../helpers/util';
import pageTabList from './pageTabs/PageTabList';

const separatorId = '@';

export default class DashboardService {
  static SaveWays = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    CONFIRM: 'CONFIRM'
  };

  static get key() {
    return pageTabList.activeTabId || null;
  }

  static get newIdLayout() {
    return `layout_${uuid()}`;
  }

  static defaultDashboardTab = idLayout => ({ label: t('page-tabs.tab-name-default'), idLayout });

  static defaultDashboardConfig = idLayout => ({
    layout: {
      id: idLayout,
      tab: DashboardService.defaultDashboardTab(idLayout),
      type: LayoutTypes.TWO_COLUMNS_BS,
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
    return (id || '').replace(SourcesId.DASHBOARD + separatorId, '');
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

    const fullId = result.id || '';
    const dashboardId = DashboardService.formShortId(fullId);

    return {
      dashboardId
    };
  }

  static getCacheKey({ type, user } = {}) {
    return `${type}|${user}`;
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

  /**
   * for old version, which has one layout (just object) without tab
   * @param config
   * @param layouts
   */
  static movedToListLayout(config, layouts) {
    if (isEmpty(layouts)) {
      const layout = get(config, ['layout'], {});

      layout.id = DashboardService.newIdLayout;
      layout.tab = DashboardService.defaultDashboardTab(layout.id);

      if (!isEmpty(layout)) {
        layouts.push(layout);
      }
    }
  }

  static generateNewMobileConfig(source = []) {
    const mobile = [];

    source.forEach(layout => {
      const { id: idLayout, columns = [], tab = {} } = layout;

      mobile.push({
        id: idLayout,
        tab: { label: tab.label, idLayout },
        type: LayoutTypes.MOBILE,
        columns: [
          {
            widgets: columns.reduce((result, current) => {
              if (Array.isArray(current)) {
                return [...result, ...[].concat.apply([], current.map(item => get(item, 'widgets', [])))];
              }

              return [...result, ...get(current, 'widgets', [])];
            }, [])
          }
        ]
      });
    });

    return mobile;
  }

  static getWidgetsById(widgets = []) {
    return widgets.reduce(
      (res, widget) => ({
        ...res,
        [widget.id]: widget
      }),
      {}
    );
  }

  static migrateConfigFromOldVersion(data) {
    const source = cloneDeep(data);
    const version = get(source, 'version');
    const newVersionConfig = get(source, version, []);

    if (version === CONFIG_VERSION && !isEmpty(newVersionConfig)) {
      return source;
    }

    const getWidgetsFromColumn = (widget, column) => {
      if (Array.isArray(widget)) {
        return widget.map(widget => getWidgetsFromColumn(widget, column));
      } else {
        widgets.push(widget);
        return widget.id;
      }
    };
    const getWidgetFromLayout = column => {
      if (Array.isArray(column)) {
        return column.map((widget, index) => getWidgetFromLayout(widget, column[index]));
      } else {
        return {
          ...column,
          widgets: get(column, 'widgets', []).map(widget => getWidgetsFromColumn(widget, column))
        };
      }
    };

    let mobile = get(source, 'mobile', []);
    let desktop = get(source, 'layouts', []);
    const widgets = [];

    if (isEmpty(desktop)) {
      const layout = {};

      layout.id = DashboardService.newIdLayout;
      layout.tab = DashboardService.defaultDashboardTab(layout.id);

      desktop = [layout];
    }

    desktop = desktop.map(layout => {
      return {
        ...layout,
        columns: getWidgetFromLayout(get(layout, 'columns', []))
      };
    });

    if (isEmpty(mobile)) {
      mobile = DashboardService.generateNewMobileConfig(desktop);
    }

    return {
      ...source,
      version: CONFIG_VERSION,
      [CONFIG_VERSION]: {
        mobile,
        desktop,
        widgets
      }
    };
  }
}
