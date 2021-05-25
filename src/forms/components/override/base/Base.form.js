import set from 'lodash/set';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import baseEditForm from 'formiojs/components/base/Base.form';
import BaseEditApi from 'formiojs/components/base/editForm/Base.edit.api';

import BaseEditData from './editForm/Base.edit.data';
import BaseEditDisplay from './editForm/Base.edit.display';
import BaseEditLogic from './editForm/Base.edit.logic';

const config = {
  display: {
    label: { weight: 0 },
    hideLabel: { weight: 200 },
    tooltip: { weight: 400 },
    multiple: { weight: 500 },
    disabled: { weight: 600 },
    hidden: { weight: 700 }
  },
  api: {
    key: { weight: 100 }
  }
};

[
  { key: 'display', value: BaseEditDisplay },
  { key: 'data', value: BaseEditData },
  { key: 'logic', value: BaseEditLogic },
  { key: 'api', value: BaseEditApi }
].forEach(tab => {
  tab.value.forEach(item => {
    const tabConfig = config[tab.key];

    if (!tabConfig) {
      return;
    }

    const fields = Object.keys(tabConfig);

    if (fields.includes(item.key)) {
      const component = get(tabConfig, item.key, {});

      set(tabConfig, 'components', tabConfig.components || []);
      tabConfig.components.push({ ...cloneDeep(item), ...component });
      item.ignore = true;
    }
  });
});

export const baseEditFormConfig = [
  {
    key: 'basic',
    label: 'Basic',
    weight: 0,
    components: [
      ...get(config, 'display.components', []),
      ...get(config, 'api.components', []),
      // {
      //   weight: 100,
      //   type: 'textfield',
      //   input: true,
      //   key: 'key',
      //   label: 'Property Name',
      //   tooltip: 'The name of this field in the API endpoint.',
      //   validate: {
      //     pattern: '(\\w|\\w[\\w-.]*\\w)',
      //     patternMessage:
      //       'The property name must only contain alphanumeric characters, underscores, dots and dashes and should not be ended by dash or dot.'
      //   }
      // },

      // TODO: Display selected value as a text - есть только у SelectOrgstruct, SelectJournal

      {
        weight: 800,
        type: 'checkbox',
        label: 'Required',
        tooltip: 'A required field must be filled in before the form can be submitted.',
        key: 'validate.required',
        input: true
      },
      {
        type: 'panel',
        title: 'Simple conditional',
        key: 'simple-conditional',
        theme: 'default',
        weight: 900,
        components: [
          {
            type: 'select',
            input: true,
            label: 'This component should Display:',
            key: 'conditional.show',
            dataSrc: 'values',
            data: {
              values: [{ label: 'True', value: 'true' }, { label: 'False', value: 'false' }]
            }
          },
          {
            type: 'select',
            input: true,
            label: 'When the form component:',
            key: 'conditional.when',
            dataSrc: 'custom',
            valueProperty: 'value',
            data: {
              custom: `
            utils.eachComponent(instance.root.editForm.components, function(component, path) {
              if (component.key !== data.key) {
                values.push({
                  label: component.label || component.key,
                  value: component.key
                });
              }
            });
          `
            }
          },
          {
            type: 'textfield',
            input: true,
            label: 'Has the value:',
            key: 'conditional.eq'
          }
        ]
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
  },
  {
    key: 'api',
    components: BaseEditApi
  }
];

export default function(...extend) {
  return baseEditForm([...extend, ...baseEditFormConfig]);
}
