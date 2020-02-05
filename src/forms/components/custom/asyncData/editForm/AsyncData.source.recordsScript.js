const RECORDS_SCRIPT_PROP = 'source.recordsScript.script';

export default [
  {
    type: 'panel',
    title: 'Records Script',
    collapsible: false,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(RECORDS_SCRIPT_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: RECORDS_SCRIPT_PROP,
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
        content:
          '<p>Enter custom javascript code. You must assign the <strong>value</strong> variable. ' +
          'You can assign array of records or single record</p>'
      }
    ]
  },
  {
    weight: 200,
    type: 'datamap',
    label: 'Attributes',
    tooltip: 'Attributes to load',
    key: 'source.recordsScript.attributes',
    clearOnHide: false,
    valueComponent: {
      type: 'textfield',
      key: 'value',
      label: 'Attribute',
      defaultValue: '',
      input: true
    },
    validate: {
      required: true
    }
  }
];
