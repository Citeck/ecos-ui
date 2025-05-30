const CUSTOM_ACTIONS_BUTTON_FIELD = 'customActionRefs';
const CREATE_VARIANT_ACTIONS_FIELD = 'enableCreateButton';

export default [
  {
    type: 'textfield',
    input: true,
    key: 'modalTitle',
    label: 'Modal title (optional)',
    weight: 13,
    tooltip: `There are several options for specifying a title:
  - Simple text;
  - Component label (selector:items) that will pass through the localization function;
  - Template text like "Select: {{component.label}}", where the content between
    curly braces is the path to the value of the current component from <bold>this</bold>;
  - Localization key from the form.

All of these options go through the localization function.
    `
  },
  {
    label: {
      ru: 'Дополнительные действия',
      en: 'Additional actions'
    },
    journalId: 'ui-actions',
    multiple: true,
    displayColumns: ['moduleId', 'name', 'type'],
    key: CUSTOM_ACTIONS_BUTTON_FIELD,
    type: 'selectJournal',
    refreshOn: [],
    weight: 24,
    input: true
  },
  {
    label: {
      ru: 'Отобразить вариаты создания в компоненте',
      en: 'Show creation options in component'
    },
    type: 'checkbox',
    input: true,
    key: CREATE_VARIANT_ACTIONS_FIELD,
    defaultValue: false,
    weight: 24
  },
  {
    type: 'textarea',
    weight: 23,
    logic: [
      {
        name: 'Disabled field',
        trigger: {
          type: 'javascript',
          javascript: "result = !!data['isSelectedValueAsText']"
        },
        actions: [
          {
            name: 'Disable action',
            type: 'property',
            property: {
              label: 'Disabled',
              value: 'disabled',
              type: 'boolean'
            },
            state: true
          }
        ]
      }
    ],
    input: true,
    key: 'linkFormatter',
    label: {
      ru: 'Форматтер ссылки',
      en: 'Link formatter'
    },
    editor: 'ace',
    rows: 10,
    placeholder: 'function(ref) { ... }'
  }
];
