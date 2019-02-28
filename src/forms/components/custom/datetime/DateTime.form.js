import baseEditForm from 'formiojs/components/base/Base.form';
import DateTimeEditDisplay from './editForm/DateTime.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: DateTimeEditDisplay
      }
    ],
    ...extend
  );
}
