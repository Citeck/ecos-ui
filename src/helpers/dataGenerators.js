export function toGeneratorTree(len, lvl) {
  lvl--;
  return Array(len)
    .fill('menu')
    .map((v, i) => ({
      id: v + ' - ' + lvl + ' - ' + i,
      name: v + ' - ' + lvl + ' - ' + i,
      icon: { value: 'icon' },
      selected: true,
      editable: true,
      removable: true,
      draggable: true,
      expandable: true,
      items: lvl && toGeneratorTree(i, lvl)
    }));
}
