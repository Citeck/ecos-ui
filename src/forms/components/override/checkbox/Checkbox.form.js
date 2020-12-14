import baseEditForm from 'formiojs/components/base/Base.form';

import CheckboxEditDisplay from './editForm/Checkbox.edit.display';
import CheckboxEditData from './editForm/Checkbox.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: CheckboxEditDisplay
      },
      {
        key: 'data',
        components: CheckboxEditData
      }
    ],
    ...extend
  );
}
