import baseEditForm from '../../override/base/Base.form';

import SelectHierarchicalEditCustom from './editForm/SelectHierarchical.edit.custom';

export default function(...extend) {
  return baseEditForm(
    [
      {
        label: 'Custom',
        key: 'custom',
        weight: 10,
        components: SelectHierarchicalEditCustom
      }
    ],
    ...extend
  );
}
