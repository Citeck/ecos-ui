export const itemsByLevels = [
  {
    id: '1',
    label: 'Выбрать всех',
    isStrong: true
  },
  {
    id: '2',
    label: 'Бухгалтерия',
    isOpen: true,
    isGroup: true,
    isLoaded: true,
    items: [
      {
        id: '6',
        label: 'Бухгалтер',
        isOpen: true,
        isGroup: true,
        isLoaded: true,
        items: [
          {
            id: '7',
            label: 'Константин Константинопольский',
            isSelected: true
          }
        ]
      }
    ]
  },
  {
    id: '3',
    label: 'Директор',
    isOpen: false,
    isGroup: true,
    items: []
  },
  {
    id: '4',
    label: 'Маркетологи',
    isOpen: false,
    isGroup: true,
    items: []
  },
  {
    id: '5',
    label: 'Логистика',
    isOpen: false,
    isGroup: true,
    items: []
  }
];

export const itemsAllUsers = [
  {
    id: '1',
    label: 'Выбрать всех',
    isStrong: true
  },
  {
    id: '2',
    label: 'Сергей Сергеевич',
    isSelected: true
  },
  {
    id: '3',
    label: 'Пётр Петрович',
    isSelected: false
  },
  {
    id: '4',
    label: 'Константин Константинопольский',
    isSelected: true
  },
  {
    id: '5',
    label: 'Николай Николаевич',
    isSelected: true
  },
  {
    id: '6',
    label: 'Василий Васильевич',
    isSelected: true
  },
  {
    id: '7',
    label: 'Андрей Андреевич',
    isSelected: true
  }
];

export const itemsSelected = [
  // {
  //   id: '1',
  //   label: 'Выбрать всех',
  //   isStrong: true,
  // },
  {
    id: '2',
    label: 'Сергей Сергеевич',
    isSelected: true
  },
  {
    id: '3',
    label: 'Пётр Петрович',
    isSelected: true
  },
  {
    id: '4',
    label: 'Константин Константинопольский',
    isSelected: true
  },
  {
    id: '5',
    label: 'Маркетологи',
    isSelected: true
  }
];
