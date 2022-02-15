import baseEditForm from '../../override/base/Base.form';
import SelectJournalEditDisplay from './editForm/SelectJournal.edit.display';
import SelectJournalEditData from './editForm/SelectJournal.edit.data';
import SelectJournalEditCustom from './editForm/SelectJournal.edit.custom';

export default function(...extend) {
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
