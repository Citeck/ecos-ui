import baseEditForm from 'formiojs/components/base/Base.form';
import TableFormDisplayData from './editForm/TableForm.display.data';
import TableFormEditData from './editForm/TableForm.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: TableFormDisplayData
      },
      {
        key: 'data',
        components: TableFormEditData
      }
    ],
    ...extend
  );
}
