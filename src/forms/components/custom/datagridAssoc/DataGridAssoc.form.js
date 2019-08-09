import baseEditForm from 'formiojs/components/base/Base.form';

import DataGridAssocEditDisplay from './editForm/DataGridAssoc.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: DataGridAssocEditDisplay
      }
    ],
    ...extend
  );
}
