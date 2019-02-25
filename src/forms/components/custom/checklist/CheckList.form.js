import baseEditForm from 'formiojs/components/base/Base.form';
import CheckListEditFile from './editForm/CheckList.edit.file';

export default function(...extend) {
  return baseEditForm(
    [
      {
        label: 'CheckList',
        key: 'checklist',
        weight: 5,
        components: CheckListEditFile
      }
    ],
    ...extend
  );
}
