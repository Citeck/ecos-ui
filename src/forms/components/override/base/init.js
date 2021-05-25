import cloneDeep from 'lodash/cloneDeep';
import unionWith from 'lodash/unionWith';

import baseEditForm from 'formiojs/components/base/Base.form';
import BaseEditConditional from 'formiojs/components/base/editForm/Base.edit.conditional';
import BaseEditData from 'formiojs/components/base/editForm/Base.edit.data';
import BaseEditAPI from 'formiojs/components/base/editForm/Base.edit.api';
import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';
import BaseEditLogic from 'formiojs/components/base/editForm/Base.edit.logic';
import BaseEditValidation from 'formiojs/components/base/editForm/Base.edit.validation';
import BaseEditLayout from 'formiojs/components/base/editForm/Base.edit.layout';

import EditFormUtils from 'formiojs/components/base/editForm/utils';

Object.setPrototypeOf(baseEditForm, function(...extend) {
  const components = cloneDeep([
    {
      type: 'tabs',
      key: 'tabs',
      components: [
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
          label: 'Display',
          key: 'display',
          weight: 5,
          components: BaseEditDisplay
        },
        {
          label: 'Data',
          key: 'data',
          weight: 10,
          components: BaseEditData
        },
        {
          label: 'Validation',
          key: 'validation',
          weight: 20,
          components: BaseEditValidation
        },
        {
          label: 'API',
          key: 'api',
          weight: 30,
          components: BaseEditAPI
        },
        {
          label: 'Conditional',
          key: 'conditional',
          weight: 40,
          components: BaseEditConditional
        },
        {
          label: 'Logic',
          key: 'logic',
          weight: 50,
          components: BaseEditLogic
        },
        {
          label: 'Layout',
          key: 'layout',
          weight: 60,
          components: BaseEditLayout
        }
      ]
    }
  ]).concat(
    extend.map(items => ({
      type: 'tabs',
      key: 'tabs',
      components: items
    }))
  );

  return {
    components: unionWith(components, EditFormUtils.unifyComponents).concat({
      type: 'hidden',
      key: 'type'
    })
  };
});

// console.warn({ baseEditForm });

// baseEditForm = function(...extend) {
//   const components = cloneDeep([
//     {
//       type: 'tabs',
//       key: 'tabs',
//       components: [
//         {
//           key: 'base',
//           label: 'Base',
//           weight: 0,
//           components: [
//             {
//               label: 'Base tab first component',
//               labelPosition: 'left-left',
//               type: 'checkbox',
//               input: true,
//               key: 'removeIndents',
//               defaultValue: false
//             }
//           ]
//         },
//         {
//           label: 'Display',
//           key: 'display',
//           weight: 5,
//           components: BaseEditDisplay
//         },
//         {
//           label: 'Data',
//           key: 'data',
//           weight: 10,
//           components: BaseEditData
//         },
//         {
//           label: 'Validation',
//           key: 'validation',
//           weight: 20,
//           components: BaseEditValidation
//         },
//         {
//           label: 'API',
//           key: 'api',
//           weight: 30,
//           components: BaseEditAPI
//         },
//         {
//           label: 'Conditional',
//           key: 'conditional',
//           weight: 40,
//           components: BaseEditConditional
//         },
//         {
//           label: 'Logic',
//           key: 'logic',
//           weight: 50,
//           components: BaseEditLogic
//         },
//         {
//           label: 'Layout',
//           key: 'layout',
//           weight: 60,
//           components: BaseEditLayout
//         }
//       ]
//     }
//   ]).concat(extend.map((items) => ({
//     type: 'tabs',
//     key: 'tabs',
//     components: items
//   })));
//
//   return {
//     components: unionWith(components, EditFormUtils.unifyComponents).concat({
//       type: 'hidden',
//       key: 'type'
//     })
//   };
// };

console.warn({ baseEditForm });

export default baseEditForm;
