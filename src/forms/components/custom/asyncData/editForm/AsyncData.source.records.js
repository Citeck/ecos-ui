const QUERY_PROP = 'source.records.query';

export default [
  {
    type: 'panel',
    title: 'Records query',
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
    key: 'source.records.attributes',
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

  /*_.extend(
    EditFormUtils.javaScriptValue('Query', 'records.query.js', 'records.query.json', 110,
      '<p>You must assign the <strong>query</strong> variable.</p>' +
      '<h5>Example</h5><pre>query = {<br>' +
      '"query":{ asddsd}' +
      '};</pre>',
      '<p><a href="http://formio.github.io/formio.js/app/examples/conditions.html" target="_blank">Click here for an example</a></p>'
    ))*/
];
