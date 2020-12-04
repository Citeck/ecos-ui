import baseEditForm from 'formiojs/components/base/Base.form';
import SelectOrgstructEditCustom from './editForm/SelectOrgstruct.edit.custom';
import SelectOrgstructEditDisplay from './editForm/SelectOrgstruct.edit.display';
import SelectOrgstructEditData from './editForm/SelectOrgstruct.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: SelectOrgstructEditDisplay
      },
      {
        label: 'Custom',
        key: 'custom',
        weight: 10,
        components: SelectOrgstructEditCustom
      },
      {
        key: 'data',
        components: SelectOrgstructEditData
      }
    ],
    ...extend
  );
}
