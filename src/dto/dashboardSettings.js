import { get, isEmpty } from 'lodash';
import { LAYOUT_TYPE } from '../constants/layout';
import Components from '../components/Components';
import * as dtoMenu from './menu';
import DashboardService from '../services/dashboard';

export default class DashboardSettingsConverter {
  static getSettingsConfigForWeb(source = {}) {
    let target = {};

    if (!isEmpty(source)) {
      const { key, id = '', type, config } = source;

      target.identification = { key, type, id: DashboardService.parseDashboardId(id) };

      const layouts = get(config, ['layouts'], []);

      //for old version, which has one layout without tab
      if (isEmpty(layouts)) {
        const layout = get(config, ['layout']) || {};
        layout.id = 'layout_0';

        if (!isEmpty(layout)) {
          layouts.push(layout);
        }
      }

      target.config = [];

      layouts.forEach(item => {
        target.config.push(DashboardSettingsConverter.getSettingsLayoutForWeb(item));
      });
    }

    return target;
  }

  static getSettingsLayoutForWeb(source = {}) {
    let target = {};

    target.id = source.id;
    target.tab = source.tab || DashboardService.defaultDashboardConfig.layout.tab;
    target.type = source.type || LAYOUT_TYPE.TWO_COLUMNS_BS;
    target.widgets = !isEmpty(source.columns) ? source.columns.map(item => item.widgets) : [];

    return target;
  }

  static getSettingsConfigForServer(source) {
    const target = {
      layout: {},
      menu: {}
    };

    target.menu.type = source.menuType;
    target.menu.links = dtoMenu.getMenuItemsForServer(source.links);

    target.layout.type = source.layoutType;
    target.layout.columns = DashboardSettingsConverter.getWidgetsForServer(source.columns, source.widgets);

    return target;
  }

  static getWidgetsForServer(columns = [], widgets = []) {
    let defProps = Components.setDefaultPropsOfWidgets(widgets);

    return columns.map((column, index) => {
      const data = {
        widgets: defProps[index] || []
      };

      if (column.width) {
        data.width = column.width;
      }

      return data;
    });
  }
}
