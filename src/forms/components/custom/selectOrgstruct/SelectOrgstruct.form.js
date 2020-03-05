import baseEditForm from 'formiojs/components/base/Base.form';
import SelectOrgstructCustomDisplay from './editForm/SelectOrgstruct.custom.data';
import SelectOrgstructEditDisplay from './editForm/SelectOrgstruct.edit.display';

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
        components: SelectOrgstructCustomDisplay
      }
    ],
    ...extend
  );
}
