import get from 'lodash/get';
import set from 'lodash/set';
import BaseEditLogic from 'formiojs/components/base/editForm/Base.edit.logic';
import { getCurrentLocale } from '../../../../../helpers/export/util';
import i18next from '../../../../i18next';

BaseEditLogic.splice(0, BaseEditLogic.length);

const { translation } = i18next['options']['resources'][getCurrentLocale()];

const settings = [
  {
    weight: 0,
    input: true,
    label: translation.logic,
    key: 'logic',
    templates: {
      header:
        '<div class="row"> \n  <div class="col-sm-6">\n    <strong>{{ value.length }} Advanced Logic Configured</strong>\n  </div>\n</div>',
      row:
        '<div class="row"> \n  <div class="col-sm-6">\n    <div>{{ row.name }} </div>\n  </div>\n  <div class="col-sm-2"> \n    <div class="btn-group pull-right"> \n      <div class="btn btn-default editRow">Edit</div> \n      <div class="btn btn-danger removeRow">Delete</div> \n    </div> \n  </div> \n</div>',
      footer: ''
    },
    type: 'editgrid',
    addAnother: 'Add Logic',
    saveRow: 'Save Logic',
    components: [
      {
        weight: 0,
        input: true,
        inputType: 'text',
        label: translation.name,
        key: 'name',
        validate: {
          required: true
        },
        type: 'textfield'
      },
      {
        weight: 10,
        key: 'triggerPanel',
        input: false,
        title: translation.triggerPanel,
        tableView: false,
        components: [
          {
            weight: 0,
            input: true,
            tableView: false,
            components: [
              {
                weight: 0,
                input: true,
                label: 'Type',
                key: 'type',
                tableView: false,
                data: {
                  values: [
                    {
                      value: 'simple',
                      label: 'Simple'
                    },
                    {
                      value: 'javascript',
                      label: 'Javascript'
                    },
                    {
                      value: 'json',
                      label: 'JSON Logic'
                    },
                    {
                      value: 'event',
                      label: 'Event'
                    }
                  ]
                },
                dataSrc: 'values',
                template: '<span>{{ item.label }}</span>',
                type: 'select'
              },
              {
                weight: 10,
                label: '',
                key: 'simple',
                type: 'container',
                tableView: false,
                customConditional(context) {
                  return context.row.type === 'simple';
                },
                components: [
                  {
                    input: true,
                    key: 'show',
                    label: translation.show,
                    type: 'hidden',
                    tableView: false,
                    defaultValue: true
                  },
                  {
                    type: 'select',
                    input: true,
                    label: translation.when,
                    key: 'when',
                    dataSrc: 'custom',
                    valueProperty: 'value',
                    tableView: false,
                    data: {
                      custom(context) {
                        var values = [];
                        context.utils.eachComponent(context.instance.root.editForm.components, function(component, path) {
                          if (component.key !== context.data.key) {
                            values.push({
                              label: component.label || component.key,
                              value: path
                            });
                          }
                        });
                        return values;
                      }
                    }
                  },
                  {
                    type: 'textfield',
                    input: true,
                    label: translation.eq,
                    key: 'eq',
                    tableView: false
                  }
                ]
              },
              {
                weight: 10,
                type: 'textarea',
                key: 'javascript',
                rows: 5,
                editor: 'ace',
                input: true,
                tableView: false,
                placeholder: `result = (data['mykey'] > 1);`,
                description: '"row", "data", and "component" variables are available. Return "result".',
                customConditional(context) {
                  return context.row.type === 'javascript';
                }
              },
              {
                weight: 10,
                type: 'textarea',
                key: 'json',
                rows: 5,
                editor: 'ace',
                label: 'JSON Logic',
                as: 'json',
                input: true,
                tableView: false,
                placeholder: `{ ... }`,
                description:
                  '"row", "data", "component" and "_" variables are available. Return the result to be passed to the action if truthy.',
                customConditional(context) {
                  return context.row.type === 'json';
                }
              },
              {
                weight: 10,
                type: 'textfield',
                key: 'event',
                label: translation.event,
                placeholder: 'event',
                description: 'The event that will trigger this logic. You can trigger events externally or via a button.',
                tableView: false,
                customConditional(context) {
                  return context.row.type === 'event';
                }
              }
            ],
            key: 'trigger',
            type: 'container'
          }
        ],
        type: 'panel'
      },
      {
        weight: 20,
        input: true,
        label: translation.actions,
        key: 'actions',
        tableView: false,
        templates: {
          header: '<div class="row"> \n  <div class="col-sm-6"><strong>{{ value.length }} actions</strong></div>\n</div>',
          row:
            '<div class="row"> \n  <div class="col-sm-6">\n    <div>{{ row.name }} </div>\n  </div>\n  <div class="col-sm-2"> \n    <div class="btn-group pull-right"> \n      <div class="btn btn-default editRow">Edit</div> \n      <div class="btn btn-danger removeRow">Delete</div> \n    </div> \n  </div> \n</div>',
          footer: ''
        },
        type: 'editgrid',
        addAnother: 'Add Action',
        saveRow: 'Save Action',
        components: [
          {
            weight: 0,
            title: translation.actionPanel,
            input: false,
            key: 'actionPanel',
            type: 'panel',
            components: [
              {
                weight: 0,
                input: true,
                inputType: 'text',
                label: 'Action Name',
                key: 'name',
                validate: {
                  required: true
                },
                type: 'textfield'
              },
              {
                weight: 10,
                input: true,
                label: 'Type',
                key: 'type',
                data: {
                  values: [
                    {
                      value: 'property',
                      label: 'Property'
                    },
                    {
                      value: 'value',
                      label: 'Value'
                    },
                    {
                      label: 'Validation',
                      value: 'validation'
                    }
                  ]
                },
                dataSrc: 'values',
                template: '<span>{{ item.label }}</span>',
                type: 'select'
              },
              {
                weight: 20,
                type: 'select',
                template: '<span>{{ item.label }}</span>',
                dataSrc: 'json',
                tableView: false,
                data: {
                  json: [
                    {
                      label: 'Hidden',
                      value: 'hidden',
                      type: 'boolean'
                    },
                    {
                      label: 'Required',
                      value: 'validate.required',
                      type: 'boolean'
                    },
                    {
                      label: 'Disabled',
                      value: 'disabled',
                      type: 'boolean'
                    },
                    {
                      label: 'Label',
                      value: 'label',
                      type: 'string'
                    },
                    {
                      label: 'Title',
                      value: 'title',
                      type: 'string'
                    },
                    {
                      label: 'Tooltip',
                      value: 'tooltip',
                      type: 'string'
                    },
                    {
                      label: 'Description',
                      value: 'description',
                      type: 'string'
                    },
                    {
                      label: 'Placeholder',
                      value: 'placeholder',
                      type: 'string'
                    },
                    {
                      label: 'CSS Class',
                      value: 'className',
                      type: 'string'
                    },
                    {
                      label: 'Container Custom Class',
                      value: 'customClass',
                      type: 'string'
                    }
                  ],
                  values: []
                },
                key: 'property',
                label: 'Component Property',
                input: true,
                customConditional(context) {
                  return context.row.type === 'property';
                }
              },
              {
                weight: 30,
                input: true,
                label: translation.state,
                key: 'state',
                tableView: false,
                data: {
                  values: [
                    {
                      label: 'True',
                      value: 'true'
                    },
                    {
                      label: 'False',
                      value: 'false'
                    }
                  ]
                },
                dataSrc: 'values',
                template: '<span>{{ item.label }}</span>',
                type: 'select',
                customConditional(context) {
                  return (
                    context.row.type === 'property' && context.row.hasOwnProperty('property') && context.row.property.type === 'boolean'
                  );
                }
              },
              {
                weight: 30,
                type: 'textfield',
                key: 'text',
                label: 'Text',
                inputType: 'text',
                input: true,
                tableView: false,
                description: 'Can use templating with {{ data.myfield }}. "data", "row", "component" and "result" variables are available.',
                customConditional(context) {
                  return (
                    context.row.type === 'property' &&
                    context.row.hasOwnProperty('property') &&
                    context.row.property.type === 'string' &&
                    !context.row.property.component
                  );
                }
              },
              {
                weight: 20,
                input: true,
                label: 'Value (Javascript)',
                key: 'value',
                editor: 'ace',
                rows: 5,
                placeholder: `value = data.myfield;`,
                type: 'textarea',
                tableView: false,
                description: '"row", "data", "component", and "result" variables are available. Return the value.',
                customConditional(context) {
                  return context.row.type === 'value';
                }
              }
            ]
          }
        ]
      }
    ]
  }
];

settings.map(item => {
  return BaseEditLogic.push(item);
});

const advancedLogicComponent = BaseEditLogic.find(item => item.key === 'logic');
const actionsGrid = get(advancedLogicComponent, 'components', []).find(item => item.key === 'actions');
const actionPanel = get(actionsGrid, 'components', []).find(item => item.key === 'actionPanel');
const actionTypeProperty = get(actionPanel, 'components', []).find(item => item.key === 'property');
const triggerPanel = get(advancedLogicComponent, 'components', []).find(item => item.key === 'triggerPanel');

// Cause: https://citeck.atlassian.net/browse/ECOSUI-1259
if (triggerPanel && triggerPanel.components) {
  const typeSimple = get(triggerPanel, 'components.0.components', []).find(item => item.key === 'simple');
  const conditionalWhen = get(typeSimple, 'components', []).find(item => item.key === 'when');

  if (conditionalWhen) {
    conditionalWhen.data = {
      custom: `
      utils.eachComponent(instance.root.editForm.components, function(component, path) {      
        if (component.key !== data.key) {
          values.push({
            label: component.labelByLocale || utils.getTextByLocale(component.label) || component.label || component.key,
            value: path
          });
        }
      });
    `
    };
  }
}

BaseEditLogic.push({
  key: 'logic',
  cancelRow: 'Cancel'
});

// Cause: https://citeck.atlassian.net/browse/ECOSCOM-3287
set(actionTypeProperty, 'data.json', [
  { label: 'Persistent', value: 'persistent', type: 'boolean' },
  ...get(actionTypeProperty, 'data.json', [])
]);

export default BaseEditLogic;
