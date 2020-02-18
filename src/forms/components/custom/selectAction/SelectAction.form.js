import baseEditForm from 'formiojs/components/base/Base.form';
import SelectActionEditDisplay from './editForm/SelectAction.edit.display';
import SelectActionEditData from './editForm/SelectAction.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: SelectActionEditDisplay
      },
      {
        key: 'data',
        components: SelectActionEditData
      }
    ],
    ...extend
  );
}
