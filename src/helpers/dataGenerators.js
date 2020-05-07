export function toGeneratorTree(len = 0, lvl = 0, parentI = 0) {
  lvl--;
  return Array(len)
    .fill('test--')
    .map((v, i) => ({
      id: v + lvl + parentI + i,
      name: v + lvl + ' - ' + i,
      icon: { value: 'fa-plus', type: 'fa' },
      // badge: i*3,
      selected: true,
      editable: true,
      removable: true,
      draggable: true,
      expandable: true,
      dndIdx: parseInt(`${lvl}${parentI}${i}`, 10),
      items: lvl >= 0 ? toGeneratorTree(i, lvl, i) : []
    }));
}
