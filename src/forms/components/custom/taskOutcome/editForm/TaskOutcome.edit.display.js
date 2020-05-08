import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';

export default [
  {
    type: 'select',
    input: true,
    key: 'buttonSize',
    label: 'Button size',
    tooltip: 'The button size, as defined through the Bootstrap Documentation',
    weight: 18,
    defaultValue: 'md',
    dataSrc: 'values',
    data: {
      values: [
        { label: 'xs', value: 'xs' },
        { label: 'sm', value: 'sm' },
        { label: 'md', value: 'md' },
        { label: 'lg', value: 'lg' },
        { label: 'xl', value: 'xl' }
      ]
    }
  },
  {
    weight: 0,
    type: 'textfield',
    input: true,
    key: 'message',
    label: 'Message',
    tooltip: 'This message is displayed when the action buttons are not defined',
    defaultValue: 'Action buttons not defined',
    validate: {
      required: true
    }
  },
  ...BaseEditDisplay
];
