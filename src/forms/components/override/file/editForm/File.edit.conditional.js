export default [
  {
    type: 'panel',
    title: 'DisplayElements',
    collapsible: true,
    collapsed: true,
    style: {
      'margin-bottom': '20px'
    },
    key: 'displayElementsJS-js',
    components: [
      {
        type: 'textarea',
        key: 'displayElementsJS',
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        content: `<p>Enter custom javascript code. 
You must assign the <strong>value</strong> variable. 
The <strong>value</strong> variable can contain next boolean properties: <strong>upload, delete</strong>. 
For example, value = {upload: false, delete: false};</p>`
      }
    ]
  }
];
