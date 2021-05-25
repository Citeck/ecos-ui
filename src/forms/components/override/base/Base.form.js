import baseEditForm from 'formiojs/components/base/Base.form';

import BaseEditData from './editForm/Base.edit.data';
import BaseEditDisplay from './editForm/Base.edit.display';
import BaseEditLogic from './editForm/Base.edit.logic';

export const baseEditFormConfig = [
  {
    key: 'basic',
    label: 'Basic',
    weight: 0,
    components: [
      {
        weight: 0,
        type: 'textfield',
        input: true,
        key: 'label',
        label: 'Label',
        placeholder: 'Field Label',
        tooltip: 'The label for this field that will appear next to it.',
        validate: {
          required: true
        }
      },
      {
        weight: 100,
        type: 'textfield',
        input: true,
        key: 'key',
        label: 'Property Name',
        tooltip: 'The name of this field in the API endpoint.',
        validate: {
          pattern: '(\\w|\\w[\\w-.]*\\w)',
          patternMessage:
            'The property name must only contain alphanumeric characters, underscores, dots and dashes and should not be ended by dash or dot.'
        }
      },
      {
        weight: 200,
        type: 'checkbox',
        label: 'Hide Label',
        tooltip: 'Hide the label of this component. This allows you to show the label in the form builder, but not when it is rendered.',
        key: 'hideLabel',
        input: true
      },
      // TODO: Display selected value as a text - есть только у SelectOrgstruct, SelectJournal
      {
        weight: 400,
        type: 'textarea',
        input: true,
        key: 'tooltip',
        label: 'Tooltip',
        placeholder: 'To add a tooltip to this field, enter text here.',
        tooltip: 'Adds a tooltip to the side of this field.'
      },
      {
        weight: 500,
        type: 'checkbox',
        label: 'Multiple Values',
        tooltip: 'Allows multiple values to be entered for this field.',
        key: 'multiple',
        input: true
      },
      {
        weight: 600,
        type: 'checkbox',
        label: 'Disabled',
        tooltip: 'Disable the form input.',
        key: 'disabled',
        input: true
      },
      {
        weight: 700,
        type: 'checkbox',
        label: 'Hidden',
        tooltip: 'A hidden field is still a part of the form, but is hidden from view.',
        key: 'hidden',
        input: true
      },
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
  }
];

export default function(...extend) {
  return baseEditForm([...extend, ...baseEditFormConfig]);
}
