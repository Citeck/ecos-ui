export function toGeneratorTree(len = 0, lvl = 0) {
  if (lvl <= 0) return [];

  function f(l, d = 1, parentI) {
    if (d > lvl) return [];

    return Array(l)
      .fill('test--')
      .map((v, i) => ({
        id: v + d + (parentI || 0) + i,
        name: v + d + ' - ' + i,
        icon: d === 1 ? { value: 'fa-plus', type: 'fa' } : undefined,
        // badge: i*3,
        visible: true,
        editable: true,
        removable: true,
        draggable: true,
        items: f(l - 1, d + 1, i)
      }));
  }

  return f(len);
}
