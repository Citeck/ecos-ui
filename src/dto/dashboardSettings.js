import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { LAYOUT_TYPE } from '../constants/layout';
import Components from '../components/Components';
import DashboardConverter from './dashboard';
import * as dtoMenu from './menu';

export default class DashboardSettingsConverter {
  static getSettingsConfigForWeb(source = {}) {
    let target = {};

    if (!isEmpty(source)) {
      const { config } = source;
      const layout = get(config, ['layout']) || {};

      target = DashboardConverter.getDashboardForWeb(source);

      target.layoutType = target.type || LAYOUT_TYPE.TWO_COLUMNS_BS;
      target.widgets = !isEmpty(layout.columns) ? layout.columns.map(item => item.widgets) : [];

      delete target.type;
      delete target.columns;
    }

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
