import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';
import { t } from '../../../../../helpers/export/util';

BaseEditDisplay.push(
  {
    type: 'checkbox',
    input: true,
    weight: 650,
    key: 'disableInlineEdit',
    label: `Disable inline editing in view mode`
  },
  {
    type: 'select',
    key: 'test',
    label: t('ecos.forms.test'),
    data: {
      values: [{ label: t('ecos.forms.test'), value: 'top' }]
    }
  }
);

const mutatingFields = {
  label: { type: 'mlText' },
  placeholder: { type: 'mlText' },
  description: { type: 'mlText' },
  tooltip: { type: 'mlTextarea' }
};

const fields = Object.keys(mutatingFields);

export default BaseEditDisplay.map(item => {
  console.log('ITEM', item);
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
