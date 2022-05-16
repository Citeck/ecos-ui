import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';

import { t } from '../../../../../helpers/export/util';

BaseEditDisplay.push({
  type: 'checkbox',
  input: true,
  weight: 650,
  key: 'disableInlineEdit',
  label: `Disable inline editing in view mode`
});

const labelPosition = BaseEditDisplay.find(item => item.key === 'labelPosition');

if (labelPosition) {
  labelPosition.data.values = [
    {
      get label() {
        return t('form-constructor.select.top');
      },
      value: 'top'
    },
    { label: 'Left (Left-aligned)', value: 'left-left' },
    { label: 'Left (Right-aligned)', value: 'left-right' },
    { label: 'Right (Left-aligned)', value: 'right-left' },
    { label: 'Right (Right-aligned)', value: 'right-right' },
    { label: 'Bottom', value: 'bottom' }
  ];
}

const mutatingFields = {
  label: { type: 'mlText' },
  placeholder: { type: 'mlText' },
  description: { type: 'mlText' },
  tooltip: { type: 'mlTextarea' }
};

const fields = Object.keys(mutatingFields);

export default BaseEditDisplay.map(item => {
  if (fields.includes(item.key)) {
    const data = mutatingFields[item.key];

    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        item[key] = data[key];
      }
    }
  }

  return item;
});
