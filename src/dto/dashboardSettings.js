export function settingsConfigForWeb(source) {
  const { layout, menu } = source;
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

  target.layout.type = source.layoutType;
  target.menu.type = source.menuType;
  target.layout.columns = source.columns.map((column, index) => {
    const data = {
      widgets: source.widgets[index]
    };

    if (column.width) {
      data.width = column.width;
    }

    return data;
  });

  return target;
}
