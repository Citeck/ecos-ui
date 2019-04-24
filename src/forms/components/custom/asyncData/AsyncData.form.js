import RecordsQuerySource from './editForm/AsyncData.source.recordsQuery';
import RecordSource from './editForm/AsyncData.source.record';
import AjaxSource from './editForm/AsyncData.source.ajax';
import CustomSource from './editForm/AsyncData.source.custom';
import AdvancedTab from './editForm/AsyncData.tab.advanced';

export default function(...extend) {
  return {
    components: [
      {
        type: 'tabs',
        key: 'tabs',
        components: [
          {
            label: 'Async Data',
            key: 'async-data',
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
                type: 'select',
                input: true,
                label: 'Data type:',
                key: 'source.type',
                dataSrc: 'values',
                defaultValue: 'record',
                data: {
                  values: [
                    { label: 'Record', value: 'record' },
                    { label: 'Records Query', value: 'recordsQuery' },
                    { label: 'Ajax', value: 'ajax' },
                    { label: 'Custom', value: 'custom' }
                  ]
                }
              },
              {
                type: 'panel',
                collapsible: false,
                key: 'source.records.config-panel',
                components: RecordsQuerySource,
                conditional: {
                  json: {
                    and: [{ '==': [{ var: 'data.source.type' }, 'recordsQuery'] }]
                  }
                }
              },
              {
                type: 'panel',
                collapsible: false,
                key: 'source.record.config-panel',
                components: RecordSource,
                conditional: {
                  json: {
                    and: [{ '==': [{ var: 'data.source.type' }, 'record'] }]
                  }
                }
              },
              {
                type: 'panel',
                collapsible: false,
                key: 'source.ajax.config-panel',
                components: AjaxSource,
                conditional: {
                  json: {
                    and: [{ '==': [{ var: 'data.source.type' }, 'ajax'] }]
                  }
                }
              },
              {
                type: 'panel',
                collapsible: false,
                key: 'source.custom.config-panel',
                components: CustomSource,
                conditional: {
                  json: {
                    and: [{ '==': [{ var: 'data.source.type' }, 'custom'] }]
                  }
                }
              }
            ]
          },
          {
            label: 'Advanced',
            key: 'advanced',
            weight: 30,
            components: AdvancedTab
          },
          {
            label: 'API',
            key: 'api',
            weight: 50,
            components: [
              {
                weight: 0,
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
                weight: 100,
                type: 'tags',
                input: true,
                label: 'Field Tags',
                storeas: 'array',
                tooltip: 'Tag the field for use in custom logic.',
                key: 'tags'
              }
            ]
          }
        ]
      },
      {
        type: 'hidden',
        key: 'type'
      }
    ]
  };
}
