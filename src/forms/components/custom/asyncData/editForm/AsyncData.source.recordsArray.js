export default [
  {
    weight: 0,
    type: 'textfield',
    input: true,
    key: 'source.recordsArray.id',
    label: 'Records array',
    tooltip: 'Records array to retrieve data',
    validate: {
      required: true
    }
  },
  {
    weight: 200,
    type: 'datamap',
    label: 'Attributes',
    tooltip: 'Attributes to load',
    key: 'source.recordsArray.attributes',
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
