export default [
  {
    type: 'panel',
    title: 'Display Elements',
    collapsible: true,
    collapsed: true,
    customClass: 'pt-1',
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
        content: `<p>
Enter custom javascript code. You must assign the <strong>value</strong> variable.
The <strong>value</strong> variable can contain next boolean properties:
<strong>create</strong>, <strong>clone</strong>, <strong>view</strong>, <strong>preview</strong>, <strong>edit</strong>, <strong>delete</strong>.
Default <em>preview</em>, <em>clone</em> are <em>false</em>.
For example, value = {view: false, edit: true, delete: false, clone: false, preview: false};
</p>`
      }
    ]
  },
  {
    type: 'panel',
    title: 'Setting Elements',
    collapsible: true,
    collapsed: true,
    customClass: 'pt-1',
    key: 'settingElementsJS-js',
    components: [
      {
        type: 'checkbox',
        input: true,
        key: 'isInstantClone',
        label: 'Instant Clone',
        tooltip: 'If flag is set, instant add runs, else form of create is shown and record is added only after submit',
        weight: 1,
        defaultValue: false,
        customClass: 'pl-1'
      }
    ]
  }
];
