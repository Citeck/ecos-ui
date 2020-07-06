import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';

const SelectActionDisplayData = [
  ...BaseEditDisplay,
  {
    type: 'select',
    key: 'theme',
    label: 'Theme',
    input: true,
    tooltip: 'The color theme of this selector.',
    dataSrc: 'values',
    weight: 140,
    data: {
      values: [
        {
          label: 'Default',
          value: 'default'
        },
        {
          label: 'Primary',
          value: 'primary'
        }
      ]
    }
  },
  {
    type: 'select',
    key: 'size',
    label: 'Size',
    input: true,
    tooltip: 'The size of this selector.',
    dataSrc: 'values',
    weight: 141,
    data: {
      values: [
        {
          label: 'Normal',
          value: 'normal'
        },
        {
          label: 'Big',
          value: 'big'
        }
      ]
    }
  }
];

export default SelectActionDisplayData;
