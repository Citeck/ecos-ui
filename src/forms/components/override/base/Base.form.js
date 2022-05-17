import baseEditForm from 'formiojs/components/base/Base.form';

import BaseEditData from './editForm/Base.edit.data';
import BaseEditDisplay from './editForm/Base.edit.display';
import BaseEditLogic from './editForm/Base.edit.logic';
import BaseEditValidation from './editForm/Base.edit.validation';
import BaseEditCondition from './editForm/Base.edit.conditional';
import BaseEditApi from './editForm/Base.edit.api';
import BaseEditLayout from './editForm/Base.edit.layout';

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
      },
      {
        key: 'api',
        components: BaseEditApi
      },
      {
        key: 'condition',
        components: BaseEditCondition
      },
      {
        key: 'layout',
        components: BaseEditLayout
      }
    ],
    ...extend
  );
}
