import CheckboxEditDisplay from 'formiojs/components/checkbox/editForm/Checkbox.edit.display';

export default [
  ...CheckboxEditDisplay,
  {
    weight: 700,
    type: 'checkbox',
    label: 'Three states',
    tooltip: 'Three states are available - true, false, null',
    key: 'hasThreeStates',
    input: true
  }
];
