export default [
  {
    weight: 0,
    type: 'textfield',
    label: 'Upload URL',
    input: true,
    key: 'uploadUrl',
    validate: {
      required: true
    }
  },
  {
    weight: 1,
    type: 'textarea',
    label: 'Response handler',
    input: true,
    key: 'responseHandler',
    placeholder: 'result = resp.success ? resp.result : new Error(resp.errorMessage)',
    rows: 5,
    editor: 'ace',
    validate: {
      required: true
    }
  },
  {
    weight: 2,
    type: 'checkbox',
    input: true,
    key: 'multipleFiles',
    label: 'Multiple files',
    tooltip: 'You can upload multiple files at the same time',
    defaultValue: false
  }
];
