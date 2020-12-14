import BaseEditData from 'formiojs/components/base/editForm/Base.edit.data';

export default [
  ...BaseEditData,
  {
    type: 'textfield',
    label: 'Default Value',
    key: 'defaultValue',
    weight: 100,
    placeholder: 'Default Value',
    tooltip: 'The will be the value for this field, before user interaction. Having a default value will override the placeholder text.',
    input: true
    // hasThreeStates: true
  }
];
