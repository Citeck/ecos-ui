import baseEditForm from 'formiojs/components/base/Base.form';
import SelectActionEditData from './editForm/SelectAction.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'data',
        components: SelectActionEditData
      }
    ],
    ...extend
  );
}
