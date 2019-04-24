const DATA_PROP = 'source.ajax.data';
const RES_MAPPING_PROP = 'source.ajax.mapping';

export default [
  {
    weight: 0,
    type: 'textfield',
    input: true,
    key: 'source.ajax.url',
    label: 'URL',
    validate: {
      required: true
    }
  },
  {
    type: 'select',
    input: true,
    label: 'Method:',
    key: 'source.ajax.method',
    dataSrc: 'values',
    defaultValue: 'GET',
    clearOnHide: false,
    data: {
      values: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'GET' }]
    },
    validate: {
      required: true
    }
  },
  {
    type: 'panel',
    title: 'Query Data',
    collapsible: true,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(DATA_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: DATA_PROP,
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
    type: 'panel',
    title: 'Query Result Mapping',
    collapsible: true,
    collapsed: true,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(RES_MAPPING_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: RES_MAPPING_PROP,
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        content: '<p>Enter custom javascript code. You must assign the <strong>value</strong> variable.</p>'
      }
    ]
  }
];
