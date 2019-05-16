import nestedComponentForm from 'formiojs/components/nested/NestedComponent.form';

import ColumnsEditDisplay from './editForm/Columns.edit.display';

export default function(...extend) {
  return nestedComponentForm(
    [
      {
        key: 'display',
        components: ColumnsEditDisplay
      }
    ],
    ...extend
  );
}
