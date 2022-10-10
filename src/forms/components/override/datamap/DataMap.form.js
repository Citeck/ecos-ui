import dataMapEditForm from 'formiojs/components/datamap/DataMap.form';

import DataMapEditDisplay from './editForm/DataMap.edit.display';

export default function(...extend) {
  return dataMapEditForm(
    [
      {
        key: 'display',
        components: DataMapEditDisplay
      }
    ],
    ...extend
  );
}
