export default [
  {
    type: 'textfield',
    input: true,
    key: 'journalId',
    label: 'Journal ID',
    placeholder: 'Example: legal-entities',
    validate: {
      required: true
    },
    weight: 20
    // defaultValue: 'legal-entities'
  },
  {
    type: 'textfield',
    input: true,
    key: 'createFormRecord',
    label: 'Create form record',
    placeholder: 'Example: dict@idocs:legalEntity',
    weight: 20
    // defaultValue: 'dict@idocs:legalEntity'
  }
];
