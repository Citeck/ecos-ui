export function settingsConfigForWeb(source = {}) {
  const { layout = {}, menu = {} } = source;
  let target = {};

  target.layoutType = layout.type || 0;
  target.menuType = menu.type || ''; //todo what field

  target.widgets = layout.columns ? layout.columns.map(item => item.widgets) : [];
  target.menu = [];

  return target;
}

export function settingsConfigForServer(source) {
  let target = {
    layout: {},
    menu: {}
  };

  target.menu.type = source.menuType;
  target.menu.links = menuItemsForServer(source.menu);

  target.layout.type = source.layoutType;
  target.layout.columns = widgetsForServer(source.columns, source.widgets);

  return target;
}

function menuItemsForServer(items = []) {
  return items.map((item, index) => {
    return {
      label: item.label,
      position: index,
      link: item.link || ''
    };
  });
}

function widgetsForServer(columns = [], widgets = []) {
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
