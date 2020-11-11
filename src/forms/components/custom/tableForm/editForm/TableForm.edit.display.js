export default [
  {
    type: 'checkbox',
    input: true,
    key: 'noColHeaders',
    label: 'Hide columns headers',
    weight: 18,
    defaultValue: false
  },
  {
    type: 'checkbox',
    input: true,
    key: 'isStaticModalTitle',
    label: 'Hide record name in modal title',
    weight: 18,
    defaultValue: false
  },
  {
    type: 'textfield',
    input: true,
    key: 'customStringForConcatWithStaticTitle',
    label: 'Enter custom static label for concat with basic',
    weight: 18,
    defaultValue: '',
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.isStaticModalTitle' }, true] }]
      }
    }
  }
];
