import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';

BaseEditDisplay.push({
  type: 'checkbox',
  input: true,
  weight: 132,
  key: 'disableInlineEdit',
  label: `Disable inline editing in view mode`
});

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
