export function toGeneratorTree(len, lvl) {
  lvl--;
  return Array(len)
    .fill('menu')
    .map((v, i) => ({
      id: v + ' - ' + lvl + ' - ' + i,
      name: v + ' - ' + lvl + ' - ' + i,
      icon: { value: 'icon' },
      selected: i % 2,
      editable: i % 2,
      removable: i % 2,
      draggable: i % 2,
      expandable: i % 2,
      items: lvl && toGeneratorTree(i, lvl)
    }));
}
