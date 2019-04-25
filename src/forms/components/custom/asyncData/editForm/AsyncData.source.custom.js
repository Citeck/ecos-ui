const SYNC_DATA_PROP = 'source.custom.syncData';
const ASYNC_DATA_PROP = 'source.custom.asyncData';

export default [
  {
    type: 'panel',
    title: 'Sync Data',
    collapsible: true,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(SYNC_DATA_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: SYNC_DATA_PROP,
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
          '<p>Enter custom javascript code. You must assign the <strong>value</strong> variable.</p>' +
          '<p>Async data will be calculated only when sync data changes</p>'
      }
    ]
  },
  {
    type: 'panel',
    title: 'Async Data',
    collapsible: true,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(ASYNC_DATA_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: ASYNC_DATA_PROP,
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
          '<p>Enter custom javascript code. You must assign the <strong>value</strong> variable.</p>' +
          '<p>You can assign a <strong>Promise</strong> to the <strong>value</strong></p>' +
          '<p><strong>data</strong> - value from Sync Data field</p>'
      }
    ]
  }
];
