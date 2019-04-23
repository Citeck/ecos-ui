const QUERY_PROP = 'source.recordsQuery.query';

export default [
  {
    type: 'panel',
    title: 'Query',
    collapsible: true,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(QUERY_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: QUERY_PROP,
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true,
        validate: {
          required: true
        }
      },
      {
        type: 'htmlelement',
        tag: 'div',
        content: '<p>Enter custom javascript code. You must assign the <strong>value</strong> variable.</p>'
      }
    ]
  },
  {
    weight: 200,
    type: 'datamap',
    label: 'Attributes',
    tooltip: 'Attributes to load',
    key: 'source.recordsQuery.attributes',
    clearOnHide: false,
    valueComponent: {
      type: 'textfield',
      key: 'value',
      label: 'Attribute',
      defaultValue: '',
      input: true
    }
  },
  {
    label: 'Single record',
    labelPosition: 'left-left',
    shortcut: '',
    tableView: true,
    alwaysEnabled: false,
    type: 'checkbox',
    input: true,
    key: 'source.recordsQuery.isSingle',
    defaultValue: false
  }
];
