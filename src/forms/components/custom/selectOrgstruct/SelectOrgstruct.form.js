import baseEditForm from 'formiojs/components/base/Base.form';
import SelectOrgstructEditData from './editForm/SelectOrgstruct.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'data',
        components: SelectOrgstructEditData
      }
    ],
    ...extend
  );
}
