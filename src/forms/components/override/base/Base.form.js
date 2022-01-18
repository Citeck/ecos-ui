import baseEditForm from 'formiojs/components/base/Base.form';

import BaseEditData from './editForm/Base.edit.data';
import BaseEditDisplay from './editForm/Base.edit.display';
import BaseEditLogic from './editForm/Base.edit.logic';
import BaseEditValidation from './editForm/Base.edit.validation';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'data',
        components: BaseEditData
      },
      {
        key: 'display',
        components: BaseEditDisplay
      },
      {
        key: 'logic',
        components: BaseEditLogic
      },
      {
        key: 'validation',
        components: BaseEditValidation
      }
    ],
    ...extend
  );
}
