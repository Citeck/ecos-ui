import baseEditForm from 'formiojs/components/base/Base.form';

import SelectJournalEditDisplay from './editForm/SelectJournal.edit.display';
import SelectJournalEditData from './editForm/SelectJournal.edit.data';
import SelectJournalEditBasic from './editForm/SelectJournal.edit.basic';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'basic',
        components: SelectJournalEditBasic
      },
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
