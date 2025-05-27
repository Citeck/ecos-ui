import baseEditForm from 'formiojs/components/base/Base.form';
import isArray from 'lodash/isArray';

import CheckboxEditDisplay from './editForm/Checkbox.edit.display';

import { t } from '@/helpers/export/util';

export default function (...extend) {
  const form = baseEditForm(
    [
      {
        key: 'display',
        components: CheckboxEditDisplay
      }
    ],
    ...extend
  );

  const logicActions = [
    {
      name: 'Disabled field',
      trigger: {
        type: 'javascript',
        javascript: "result = !!data['hasThreeStates']"
      },
      actions: [
        {
          name: 'Disable action',
          type: 'property',
          property: {
            label: 'Disabled',
            value: 'disabled',
            type: 'boolean'
          },
          state: true
        },
        {
          name: 'Edit tips',
          type: 'property',
          property: {
            label: 'Description',
            value: 'description',
            type: 'string'
          },
          text: () => t('form-constructor.tabs-description.defaultValue.hasThreeStates.disabled')
        }
      ]
    }
  ];

  form.components = form.components.map(topComp => {
    if (topComp.type === 'tabs' || topComp.key === 'tabs') {
      topComp.components = topComp.components.map(tab => {
        if (tab.key === 'data' && isArray(tab.components)) {
          tab.components = tab.components.map(field => {
            if (field.key === 'defaultValue') {
              return {
                ...field,
                logic: logicActions
              };
            }

            if (field.key === 'customDefaultValuePanel' && isArray(field.components)) {
              field.components = field.components.map(customField => {
                if (customField.key === 'customDefaultValue-js' && isArray(customField.components)) {
                  customField.components = customField.components.map(field => {
                    if (field.key === 'customDefaultValue') {
                      return {
                        ...field,
                        logic: logicActions
                      };
                    }

                    return field;
                  });
                }

                return customField;
              });
            }

            return field;
          });
        }

        return tab;
      });
    }

    return topComp;
  });

  return form;
}
