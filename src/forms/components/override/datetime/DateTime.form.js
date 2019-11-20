import baseEditForm from 'formiojs/components/base/Base.form';

import DateTimeEditData from 'formiojs/components/datetime/editForm/DateTime.edit.data';
import DateTimeEditDate from './editForm/DateTime.edit.date';
import DateTimeEditDisplay from 'formiojs/components/datetime/editForm/DateTime.edit.display';
import DateTimeEditTime from 'formiojs/components/datetime/editForm/DateTime.edit.time';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: DateTimeEditDisplay
      },
      {
        label: 'Date',
        key: 'date',
        weight: 1,
        components: DateTimeEditDate
      },
      {
        label: 'Time',
        key: 'time',
        weight: 2,
        components: DateTimeEditTime
      },
      {
        key: 'data',
        components: DateTimeEditData
      }
    ],
    ...extend
  );
}
