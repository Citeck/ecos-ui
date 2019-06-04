export function configForWeb(source) {
  let target = {};
  const { columns = [] } = source;

  target.layoutType = source.type || 0;
  target.menuType = source.menuType || ''; //todo what field

  target.widgets = columns ? columns.map(item => item.widgets) : [];
  target.menu = [];

  return target;
}

export function configForServer(source) {
  let target = {};

  target.type = source.layoutType;
  target.menuType = source.menuType;
  target.columns = source.columns.map((column, index) => {
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
