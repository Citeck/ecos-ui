const config = [
  {
    label: 'Scrollable content',
    labelPosition: 'left-left',
    type: 'checkbox',
    input: true,
    key: 'scrollableContent',
    weight: 49,
    defaultValue: false
  },
  {
    key: 'components',
    type: 'datagrid',
    input: true,
    label: 'Tabs',
    weight: 50,
    reorder: true,
    components: [
      {
        type: 'mlText',
        input: true,
        key: 'label',
        label: 'Label'
      },
      {
        type: 'textfield',
        input: true,
        key: 'key',
        label: 'Key',
        allowCalculateOverride: true,
        calculateValue: {
          _camelCase: [
            {
              getMLValue: [
                {
                  var: 'row.label'
                }
              ]
            }
          ]
        }
      }
    ]
  }
];

export default config;
