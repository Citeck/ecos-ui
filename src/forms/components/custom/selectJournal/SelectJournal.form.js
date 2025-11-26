import baseEditForm from '../../override/base/Base.form';

import SelectJournalEditCustom from './editForm/SelectJournal.edit.custom';
import SelectJournalEditData from './editForm/SelectJournal.edit.data';
import SelectJournalEditDisplay from './editForm/SelectJournal.edit.display';

export default function (...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: SelectJournalEditDisplay
      },
      {
        label: 'Custom',
        key: 'custom',
        weight: 10,
        components: SelectJournalEditCustom
      },
      {
        key: 'data',
        components: SelectJournalEditData
      }
    ],
    ...extend
  );
}
