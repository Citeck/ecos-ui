import BaseEditData from 'formiojs/components/base/editForm/Base.edit.data';

const excludedComponents = ['defaultValue'];
const ImportButtonEditData = [
  ...BaseEditData.filter(item => !excludedComponents.includes(item.key)),
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
  },
  {
    weight: 3,
    type: 'checkbox',
    input: true,
    key: 'confirmBeforeUpload',
    label: 'Confirmation before uploading',
    tooltip: 'Show confirmation window before uploading files',
    defaultValue: false
  },
  {
    weight: 4,
    type: 'panel',
    collapsible: true,
    title: 'Confirm modal',
    key: 'confirmPanel',
    customClass: 'pb-3',
    components: [
      {
        weight: 0,
        type: 'textfield',
        label: 'Title',
        input: true,
        key: 'confirm.title'
      },
      {
        weight: 1,
        type: 'textarea',
        label: 'Description',
        input: true,
        key: 'confirm.description'
      }
    ],
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.confirmBeforeUpload' }, true] }]
      }
    }
  }
];

export default ImportButtonEditData;
