export const models = [
  {
    label: 'Формирование справок',
    author: 'author1',
    datetime: 'Today at 2:10 PM',
    viewLink: null,
    editLink: null,
    image: 'https://bpm.citeck.ru/flowable-modeler/app/rest/models/60a3f338-ee03-11e8-9d4e-001dd8b75f64/thumbnail?version=1544627716371'
  },
  {
    label: 'Формирование справок 2',
    author: 'author2',
    datetime: 'Today at 2:10 PM',
    viewLink: null,
    editLink: null
  },
  {
    label: 'Формирование справок 3',
    author: 'author3',
    datetime: 'Today at 2:10 PM',
    viewLink: null,
    editLink: null,
    image: 'https://bpm.citeck.ru/flowable-modeler/app/rest/models/360453ae-ff4c-11e7-85d6-001dd8b75f64/thumbnail?version=1544627716371'
  },
  {
    label: 'Формирование справок 4',
    author: 'author4',
    datetime: 'Today at 2:10 PM',
    viewLink: null,
    editLink: null,
    image: 'https://bpm.citeck.ru/flowable-modeler/app/rest/models/ca44c70d-e7d7-11e8-9d4e-001dd8b75f64/thumbnail?version=1544627716371'
  }
];

export const categories = [
  {
    label: 'Департамент дизайна',
    level: 0,
    models: [...models],
    categories: [
      {
        label: 'Отдел ландшафтного дизайна',
        level: 1,
        models: [...models],
        categories: [
          {
            label: 'Заголовок третьего уровня',
            level: 2,
            models: [...models]
          },
          {
            label: 'Заголовок третьего уровня 2',
            level: 2,
            isEditable: true
          }
        ]
      },
      {
        label: 'Отдел ландшафтного дизайна 2',
        level: 1,
        isEditable: true
      }
    ]
  },
  {
    label: 'Департамент дизайна 2',
    level: 0,
    models: [...models],
    categories: [
      {
        label: 'Отдел ландшафтного дизайна',
        level: 1,
        models: [...models],
        categories: [
          {
            label: 'Заголовок третьего уровня',
            level: 2,
            models: [...models]
          }
        ]
      }
    ]
  },
  {
    label: 'Департамент дизайна 3',
    level: 0,
    models: [],
    categories: [
      {
        label: 'Отдел ландшафтного дизайна',
        level: 1,
        models: [],
        categories: [
          {
            label: 'Заголовок третьего уровня',
            level: 2,
            models: []
          }
        ]
      }
    ]
  },
  {
    label: 'Департамент чего-то там',
    level: 0,
    isEditable: true
  }
];
