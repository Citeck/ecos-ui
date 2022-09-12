import { t } from '../../../../../helpers/export/util';

const CUSTOM_ACTIONS_BUTTON_FIELD = 'customActionButtonsJs';

export default [
  {
    type: 'textfield',
    input: true,
    key: 'modalTitle',
    label: 'Modal title (optional)',
    weight: 13,
    tooltip: `There are several options for specifying a title:
  - Simple text;
  - Component label (selector:items) that will pass through the localization function;
  - Template text like "Select: {{component.label}}", where the content between 
    curly braces is the path to the value of the current component from <bold>this</bold>;
  - Localization key from the form.

All of these options go through the localization function.
    `
  },
  {
    weight: 27,
    type: 'panel',
    title: {
      ru: 'Дополнительные кнопки действий',
      en: 'Custom action buttons'
    },
    collapsible: true,
    collapsed: true,
    customClass: 'mb-3',
    key: ''.concat(CUSTOM_ACTIONS_BUTTON_FIELD, '-js'),
    components: [
      {
        type: 'textarea',
        key: CUSTOM_ACTIONS_BUTTON_FIELD,
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        get content() {
          return t('form-constructor.panel.actionExecutionCondition');
        }
      }
    ]
  }
];
