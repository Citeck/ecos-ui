import baseEditForm from '../../override/base/Base.form';
import SelectEditData from './editForm/EcosSelect.edit.data';
import SelectEditValidation from './editForm/EcosSelect.edit.validation';
import EcosSelectEditDisplay from './editForm/EcosSelect.edit.display';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: EcosSelectEditDisplay
      },
      {
        key: 'data',
        components: SelectEditData
      },
      {
        key: 'validation',
        components: SelectEditValidation
      }
    ],
    ...extend
  );
}
