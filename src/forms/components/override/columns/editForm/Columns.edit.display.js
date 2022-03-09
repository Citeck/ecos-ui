export default [
  {
    weight: 159,
    type: 'checkbox',
    label: 'In-line columns',
    tooltip: 'Display columns as in-line blocks',
    key: 'inlineColumns',
    input: true
  },
  {
    weight: 150,
    type: 'datagrid',
    input: true,
    key: 'columns',
    label: 'Column Properties',
    addAnother: 'Add Column',
    tooltip: 'The size and class settings for each column.',
    components: [
      {
        type: 'number',
        key: 'xs',
        defaultValue: 0,
        label: 'xs'
      },
      {
        type: 'number',
        key: 'sm',
        defaultValue: 12,
        label: 'sm'
      },
      {
        type: 'number',
        key: 'md',
        defaultValue: 6,
        label: 'md'
      },
      {
        type: 'number',
        key: 'lg',
        defaultValue: 0,
        label: 'lg'
      },
      {
        type: 'number',
        key: 'xl',
        defaultValue: 0,
        label: 'xl'
      },
      {
        type: 'textfield',
        key: 'classes',
        defaultValue: '',
        label: 'Classes'
      }
    ]
  },
  {
    weight: 160,
    type: 'checkbox',
    label: 'Auto adjust columns',
    tooltip: 'Will automatically adjust columns based on if nested components are hidden.',
    key: 'autoAdjust',
    input: true
  },
  {
    weight: 161,
    type: 'checkbox',
    label: 'Hide Column when Children Hidden',
    key: 'hideOnChildrenHidden',
    tooltip: 'Check this if you would like to hide any column when the children within that column are also hidden',
    input: true
  },
  {
    label: 'One column in Panel when View mode',
    tooltip: 'If checked, content will be in one column irregardless the edit layout',
    labelPosition: 'left-left',
    type: 'checkbox',
    input: true,
    key: 'oneColumnPanelViewModeEnabled',
    weight: 162
  }
];
