import TextFieldEditData from 'formiojs/components/textfield/editForm/TextField.edit.data';

export default [
  ...TextFieldEditData,
  {
    weight: 105,
    type: 'checkbox',
    input: true,
    key: 'isTypeahead',
    label: {
      en: 'Typeahead',
      ru: 'Упреждающий ввод'
    }
  },
  {
    type: 'select',
    input: true,
    weight: 106,
    tooltip: '',
    key: 'dataSrc',
    defaultValue: 'custom',
    label: 'Data Source Type',
    dataSrc: 'values',
    clearOnHide: true,
    data: {
      values: [
        { label: 'Custom', value: 'custom' },
        { label: 'Values', value: 'values' },
        { label: 'Raw JSON', value: 'json' }
        // { label: 'URL', value: 'url' },
        // { label: 'Resource', value: 'resource' }
      ]
    },
    conditional: {
      json: { '===': [{ var: 'data.isTypeahead' }, true] }
    }
  },
  {
    type: 'textarea',
    as: 'json',
    editor: 'ace',
    weight: 107,
    input: true,
    key: 'data.json',
    label: 'Data Source Raw JSON',
    tooltip: 'A raw JSON array to use as a data source.',
    clearOnHide: true,
    conditional: {
      json: {
        and: [{ '===': [{ var: 'data.isTypeahead' }, true] }, { '===': [{ var: 'data.dataSrc' }, 'json'] }]
      }
    }
  },
  {
    type: 'textarea',
    input: true,
    key: 'data.custom',
    label: 'Custom Values',
    editor: 'ace',
    rows: 10,
    weight: 107,
    placeholder: 'values = [];',
    tooltip: 'Write custom code to return the value options. The form data object is available.',
    clearOnHide: true,
    conditional: {
      json: {
        and: [{ '===': [{ var: 'data.isTypeahead' }, true] }, { '===': [{ var: 'data.dataSrc' }, 'custom'] }]
      }
    }
  },
  {
    weight: 107,
    type: 'tags',
    input: true,
    label: 'Data Source Values',
    storeas: 'array',
    clearOnHide: true,
    key: 'data.values',
    conditional: {
      json: { '===': [{ var: 'data.dataSrc' }, 'values'] }
    }
  }
];
