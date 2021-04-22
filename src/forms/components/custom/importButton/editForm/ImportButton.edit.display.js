import ButtonEditDisplay from 'formiojs/components/button/editForm/Button.edit.display';

const excludedComponents = ['action', 'state'];

export default [
  ...ButtonEditDisplay.filter(item => !excludedComponents.includes(item.key)),
  {
    weight: 3,
    type: 'checkbox',
    input: true,
    key: 'isShowUploadedFile',
    label: 'Display uploaded file information',
    defaultValue: false
  }
];
