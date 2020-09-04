import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';

BaseEditDisplay.push({
  type: 'checkbox',
  input: true,
  weight: 132,
  key: 'disableInlineEdit',
  label: `Disable inline editing in view mode`
});

export default BaseEditDisplay;
