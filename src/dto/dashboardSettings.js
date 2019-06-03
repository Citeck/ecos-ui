export function configForWeb(source) {
  let target = {};
  const { columns = [] } = source;

  target.layoutType = source.type || 0;
  target.menuType = source.menuType || ''; //todo what field

  target.widgetsSelected = columns ? columns.map(item => item.widgets) : [];
  target.menuSelected = [];

  return target;
}

export function configForServer(source) {
  let target = {};

  return target;
}
