import baseEditForm from 'formiojs/components/base/Base.form';
import SelectJournalEditData from './editForm/SelectJournal.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'data',
        components: SelectJournalEditData
      }
    ],
    ...extend
  );
}
