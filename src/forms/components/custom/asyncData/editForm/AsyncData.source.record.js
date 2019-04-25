export default [
  {
    weight: 0,
    type: 'textfield',
    input: true,
    key: 'source.record.id',
    label: 'Record',
    tooltip: 'Record to retrieve data',
    validate: {
      required: true
    }
  },
  {
    weight: 200,
    type: 'datamap',
    label: 'Attributes',
    tooltip: 'Attributes to load',
    key: 'source.record.attributes',
    clearOnHide: false,
    valueComponent: {
      type: 'textfield',
      key: 'value',
      label: 'Attribute',
      defaultValue: '',
      input: true
    },
    validate: {
      required: true
    }
  }
];
