export default [
  {
    type: 'checkbox',
    input: true,
    key: 'noColHeaders',
    label: {
      ru: 'Скрыть заголовки колонок',
      en: 'Hide columns headers'
    },
    weight: 18,
    defaultValue: false
  },
  {
    type: 'checkbox',
    input: true,
    key: 'noHorizontalScroll',
    label: 'Disable horizontal scroll',
    tooltip: 'Limiting table content width to component width',
    weight: 18,
    defaultValue: false
  },
  {
    type: 'checkbox',
    input: true,
    key: 'isStaticModalTitle',
    label: {
      ru: 'Скрыть имя записи в модальном заголовке',
      en: 'Hide record name in modal title'
    },
    weight: 18,
    defaultValue: false
  },
  {
    type: 'textfield',
    input: true,
    key: 'customStringForConcatWithStaticTitle',
    label: {
      ru: 'Укажите пользовательское статическое название поля для объединения с основным',
      en: 'Enter custom static label for concat with basic'
    },
    weight: 18,
    defaultValue: '',
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.isStaticModalTitle' }, true] }]
      }
    }
  }
];
