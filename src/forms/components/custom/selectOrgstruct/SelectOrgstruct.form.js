import baseEditForm from 'formiojs/components/base/Base.form';
import SelectOrgstructCustomDisplay from './editForm/SelectOrgstruct.custom.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        label: 'Custom',
        key: 'custom',
        weight: 5,
        components: SelectOrgstructCustomDisplay
      }
    ],
    ...extend
  );
}
