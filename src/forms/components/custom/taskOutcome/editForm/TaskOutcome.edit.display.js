import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';

export default [
  {
    type: 'select',
    input: true,
    key: 'buttonSize',
    label: {
      ru: 'Размер кнопки',
      en: 'Button size'
    },
    tooltip: {
      ru: 'Размер кнопки, как определено в документации Bootstrap',
      en: 'The button size, as defined through the Bootstrap Documentation'
    },
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
    label: {
      ru: 'Сообщение',
      en: 'Message'
    },
    tooltip: {
      ru: 'Это сообщение отображается, когда кнопки действий не определены',
      en: 'This message is displayed when the action buttons are not defined'
    },
    defaultValue: {
      ru: 'Кнопки действий не определены',
      en: 'Action buttons not defined'
    },
    validate: {
      required: true
    }
  },
  ...BaseEditDisplay
];
