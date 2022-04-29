import TextFieldEditDisplay from 'formiojs/components/textfield/editForm/TextField.edit.display';

export default [
  {
    type: 'select',
    input: true,
    key: 'labelPosition',
    label: 'Позиция этикетки',
    tooltip: 'Position for the label for this field.',
    weight: 20,
    defaultValue: 'top',
    dataSrc: 'values',
    data: {
      values: [
        { label: 'Top', value: 'top' },
        { label: 'Left (Left-aligned)', value: 'left-left' },
        { label: 'Left (Right-aligned)', value: 'left-right' },
        { label: 'Right (Left-aligned)', value: 'right-left' },
        { label: 'Right (Right-aligned)', value: 'right-right' },
        { label: 'Bottom', value: 'bottom' }
      ]
    }
  },
  ...TextFieldEditDisplay
];
