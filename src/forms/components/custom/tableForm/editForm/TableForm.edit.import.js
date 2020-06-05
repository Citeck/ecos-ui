export default [
  {
    type: 'checkbox',
    input: true,
    key: 'import.enable',
    label: 'Add "Import" button',
    weight: 1,
    defaultValue: false
  },
  {
    type: 'panel',
    hideLabel: true,
    key: 'import.settings',
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.import.enable' }, true] }]
      }
    },
    components: [
      {
        type: 'textfield',
        label: 'Upload URL',
        input: true,
        key: 'import.uploadUrl'
      },
      {
        type: 'textarea',
        label: 'Response handler',
        key: 'import.responseHandler',
        placeholder: 'result = resp.success ? resp.result : new Error(resp.errorMessage)',
        rows: 5,
        editor: 'ace',
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        content: `<p>Enter custom javascript code. You must assign the <strong>result</strong> variable.</p>`
      }
    ]
  }
];
