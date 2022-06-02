import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';
import { t } from '../../../../../helpers/export/util';

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
          get label() {
            return t('form-constructor.select.default');
          },
          value: 'default'
        },
        {
          get label() {
            return t('form-constructor.select.primary');
          },
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
          get label() {
            return t('form-constructor.select.normal');
          },
          value: 'normal'
        },
        {
          get label() {
            return t('form-constructor.select.big');
          },
          value: 'big'
        }
      ]
    }
  }
];

export default SelectActionDisplayData;
