export const item1 = {
  id: 'item1',
  title: 'Репозиторий',
  parent: null,
  hasChildren: true,
  isUnfolded: true
};

export const item1111 = {
  id: 'item1.1.1.1',
  title: 'Бухгалтерия',
  parent: 'item1.1.1'
};

export const item1112 = {
  id: 'item1.1.1.2',
  title: 'Дела',
  parent: 'item1.1.1',
  hasChildren: true
};

export const demoItems = [
  item1,
  {
    id: 'item1.1',
    title: 'Документы',
    parent: 'item1',
    hasChildren: true,
    isUnfolded: true
  },
  {
    id: 'item1.1.1',
    title: 'Важные',
    parent: 'item1.1',
    hasChildren: true,
    isUnfolded: true
  },
  item1111,
  item1112,
  {
    id: 'item1.1.1.3',
    title: 'Разное',
    parent: 'item1.1.1'
  },
  {
    id: 'item1.2',
    title: 'Item 1.2',
    parent: 'item1',
    hasChildren: false
  },
  {
    id: 'item2',
    title: 'Item 2'
  }
];
