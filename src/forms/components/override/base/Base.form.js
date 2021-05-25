import baseEditForm from 'formiojs/components/base/Base.form';

import BaseEditData from './editForm/Base.edit.data';
import BaseEditDisplay from './editForm/Base.edit.display';
import BaseEditLogic from './editForm/Base.edit.logic';

export const baseEditFormConfig = [
  {
    key: 'base',
    label: 'Base',
    weight: 0,
    components: [
      {
        label: 'Base tab first component',
        labelPosition: 'left-left',
        type: 'checkbox',
        input: true,
        key: 'removeIndents',
        defaultValue: false
      }
    ]
  },
  {
    key: 'display',
    weight: 5,
    components: BaseEditDisplay
  },
  {
    key: 'data',
    components: BaseEditData
  },
  {
    key: 'logic',
    components: BaseEditLogic
  }
];

export default function(...extend) {
  return baseEditForm([...extend, ...baseEditFormConfig]);
}
