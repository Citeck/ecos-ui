export function toGeneratorTree(len, lvl, parentI = 0) {
  lvl--;
  return Array(len)
    .fill('test--')
    .map((v, i) => ({
      id: v + lvl + parentI + i,
      name: v + lvl + ' - ' + i,
      icon: { value: 'icon' },
      selected: true,
      editable: true,
      removable: true,
      draggable: true,
      expandable: true,
      dndIdx: parseInt(`${lvl}${parentI}${i}`),
      items: lvl >= 0 ? toGeneratorTree(i, lvl, i) : []
    }));
}
