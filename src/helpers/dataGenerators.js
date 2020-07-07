export function toGeneratorTree(len = 0, lvl = 0, parentI = 0) {
  if (lvl <= 0) return [];

  return Array(len)
    .fill('test--')
    .map((v, i) => ({
      id: v + lvl + parentI + i,
      name: v + lvl + ' - ' + i,
      icon: i % 2 === 0 ? undefined : { value: 'icon-usergroup' },
      badge: i % 2 === 0 ? i : undefined,
      visible: true,
      editable: true,
      removable: true,
      draggable: true,
      expandable: true,
      dndIdx: parseInt(`${lvl}${parentI}${i}`, 10),
      items: toGeneratorTree(len - 1, lvl - 1, i)
    }));
}
