export default [
  {
    type: 'checkbox',
    input: true,
    key: 'hideCreateButton',
    label: 'Hide "Create" button',
    weight: 10,
    defaultValue: false
  },
  {
    type: 'checkbox',
    input: true,
    key: 'hideEditRowButton',
    label: 'Hide "Edit row" button',
    weight: 11,
    defaultValue: false
  },
  {
    type: 'checkbox',
    input: true,
    key: 'hideDeleteRowButton',
    label: 'Hide "Delete row" button',
    weight: 12,
    defaultValue: false
  },
  {
    type: 'select',
    label: 'Value Display Option',
    key: 'valueDisplayOption',
    weight: 30,
    tooltip: '',
    template: '<span>{{ item.label }}</span>',
    data: {
      values: [
        {
          value: 'text',
          label: 'Text'
        },
        {
          value: 'json-record',
          label: 'Link'
        }
      ]
    },
    defaultValue: 'text',
    input: true
  }
];
