export function dashboardForWeb(source) {
  const { layout } = source;
  let target = {};

  target.columns = layout.columns;

  return target;
}
