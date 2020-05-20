export function toGeneratorTree(len = 0, lvl = 0, parentI) {
  if (lvl <= 0) return [];

  return Array(len)
    .fill('test--')
    .map((v, i) => ({
      id: v + lvl + (parentI || 0) + i,
      name: v + lvl + ' - ' + i,
      icon: parentI == null ? { value: 'fa-plus', type: 'fa' } : undefined,
      // badge: i*3,
      selected: true,
      editable: true,
      removable: true,
      draggable: true,
      expandable: true,
      dndIdx: parseInt(`${lvl}${parentI || 0}${i}`, 10),
      items: toGeneratorTree(len - 1, lvl - 1, i)
    }));
}
