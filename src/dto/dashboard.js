export function dashboardForWeb(source) {
  const { layout, menu } = source;
  let target = {};

  target.columns = layout.columns;
  target.menu = menu;

  return target;
}
