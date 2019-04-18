import baseEditForm from 'formiojs/components/base/Base.form';

import SelectEditData from './editForm/EcosSelect.edit.data';
import SelectEditValidation from './editForm/EcosSelect.edit.validation';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'data',
        components: SelectEditData
      },
      {
        key: 'validation',
        components: SelectEditValidation
      }
    ],
    ...extend
  );
}
