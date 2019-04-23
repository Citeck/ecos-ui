export default [
  {
    type: 'select',
    input: true,
    label: 'Update on:',
    key: 'update.type',
    dataSrc: 'values',
    defaultValue: 'any-change',
    data: {
      values: [{ label: 'Any change', value: 'any-change' }, { label: 'Event', value: 'event' }]
    }
  },
  {
    weight: 10,
    type: 'textfield',
    input: true,
    key: 'update.event',
    label: 'Event:',
    clearOnHide: false,
    validate: {
      required: true
    },
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.update.type' }, 'event'] }]
      }
    }
  },
  {
    weight: 10,
    type: 'number',
    input: true,
    key: 'update.rate',
    label: 'Update rate, ms:',
    clearOnHide: false,
    validate: {
      required: true
    },
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.update.type' }, 'any-change'] }]
      }
    }
  }
];
