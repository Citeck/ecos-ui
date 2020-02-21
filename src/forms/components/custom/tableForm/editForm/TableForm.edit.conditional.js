export default [
  {
    type: 'panel',
    title: 'Display Elements',
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
        content:
          '<p>Enter custom javascript code. You must assign the <strong>value</strong> variable. The <strong>value</strong> variable can contain next boolean properties: <strong>create</strong>, <strong>view</strong>, <strong>edit</strong>, <strong>delete</strong>. For example, value = {view: false, edit: true, delete: false};</p>'
      }
    ]
  }
];
