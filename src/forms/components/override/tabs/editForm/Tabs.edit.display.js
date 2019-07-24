import TabsEditDisplay from 'formiojs/components/tabs/editForm/Tabs.edit.display';

export default [
  {
    label: 'Scrollable content',
    labelPosition: 'left-left',
    type: 'checkbox',
    input: true,
    key: 'scrollableContent',
    weight: 49,
    defaultValue: false
  },
  ...TabsEditDisplay
];
