import get from 'lodash/get';
import unionWith from 'lodash/unionWith';
import baseEditForm from 'formiojs/components/base/Base.form';
import BaseEditApi from 'formiojs/components/base/editForm/Base.edit.api';
import BaseEditValidation from 'formiojs/components/base/editForm/Base.edit.validation';
import BaseEditConditional from 'formiojs/components/base/editForm/Base.edit.conditional';
import EditFormUtils from 'formiojs/components/base/editForm/utils';

import BaseEditData from './editForm/Base.edit.data';
import BaseEditDisplay from './editForm/Base.edit.display';
import BaseEditLogic from './editForm/Base.edit.logic';
import { processEditFormConfig } from '../../../utils';
import { advancedConfig, baseEditFormConfig, editFormSectionBasic } from '../../index';

// const advancedConfig = {
//   display: {
//     label: { weight: 0 },
//     hideLabel: { weight: 200 },
//     tooltip: { weight: 400 },
//     multiple: { weight: 500 },
//     disabled: { weight: 600 },
//     hidden: { weight: 700 }
//   },
//   api: {
//     key: { weight: 100 }
//   },
//   validation: {
//     'validate.required': { weight: 800 }
//   },
//   conditional: {
//     'simple-conditional': { weight: 900 },
//     customConditionalPanel: { onlyExpand: true, collapsed: false }
//   }
// };
// const tabsByKey = [
//   { key: 'display', content: BaseEditDisplay },
//   { key: 'data', content: BaseEditData },
//   { key: 'logic', content: BaseEditLogic },
//   { key: 'api', content: BaseEditApi },
//   { key: 'validation', content: BaseEditValidation },
//   { key: 'conditional', content: BaseEditConditional }
// ];
//
// processEditFormConfig(advancedConfig, tabsByKey);

// export const baseEditFormConfig = [
//   editFormSectionBasic,
//   {
//     key: 'display',
//     weight: 5,
//     components: BaseEditDisplay
//   },
//   {
//     key: 'data',
//     components: BaseEditData
//   },
//   {
//     key: 'logic',
//     components: BaseEditLogic
//   },
//   {
//     key: 'api',
//     components: BaseEditApi
//   },
//   {
//     key: 'conditional',
//     components: BaseEditConditional
//   },
//   {
//     key: 'validation',
//     components: BaseEditValidation
//   }
// ];

export default function(...extend) {
  console.warn('export => ', ...unionWith([...extend, ...baseEditFormConfig], EditFormUtils.unifyComponents));
  return baseEditForm(...unionWith([...extend, ...baseEditFormConfig], EditFormUtils.unifyComponents));
}
