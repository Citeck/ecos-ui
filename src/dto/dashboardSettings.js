import * as dtoMenu from './menu';

export function getSettingsConfigForWeb(source = {}) {
  const { layout = {} } = source;
  const target = {};

  target.layoutType = layout.type || 0;
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
  return columns.map((column, index) => {
    const data = {
      widgets: widgets[index] || []
    };

    if (column.width) {
      data.width = column.width;
    }

    return data;
  });
}
