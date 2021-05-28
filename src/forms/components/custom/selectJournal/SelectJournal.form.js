import baseEditForm from 'formiojs/components/base/Base.form';

import SelectJournalEditDisplay from './editForm/SelectJournal.edit.display';
import SelectJournalEditData from './editForm/SelectJournal.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: SelectJournalEditDisplay
      },
      {
        key: 'data',
        components: SelectJournalEditData
      }
    ],
    ...extend
  );
}
