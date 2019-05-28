import baseEditForm from 'formiojs/components/base/Base.form';
import TableFormEditData from './editForm/TableForm.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'data',
        components: TableFormEditData
      }
    ],
    ...extend
  );
}
