import DataTab from './editForm/AsyncData.tab.data';
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
            components: DataTab
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
