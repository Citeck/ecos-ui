import * as dtoMenu from './menu';
import DashboardService from '../services/dashboard';
import { LAYOUT_TYPE } from '../constants/layout';

export function getSettingsConfigForWeb(source = {}) {
  if (!source || (source && !Object.keys(source).length)) {
    return {};
  }

  const { layout = {}, dashboardKey, dashboardId } = source;
  const target = {};

  target.dashboardKey = dashboardKey;
  target.dashboardId = dashboardId;
  target.layoutType = layout.type || LAYOUT_TYPE.TWO_COLUMNS_BS;
  target.widgets = layout.columns ? layout.columns.map(item => item.widgets) : [];

  return target;
}

export function getSettingsConfigForServer(source) {
  const target = {
    layout: {},
    menu: {}
  };

  target.menu.type = source.menuType;
  target.menu.links = dtoMenu.getMenuItemsForServer(source.links);

  target.layout.type = source.layoutType;
  target.layout.columns = getWidgetsForServer(source.columns, source.widgets);

  return target;
}

function getWidgetsForServer(columns = [], widgets = []) {
  let defProps = DashboardService.setDefaultPropsOfWidgets(widgets);

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
