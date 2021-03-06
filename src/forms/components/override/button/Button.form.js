import ButtonEditDisplay from 'formiojs/components/button/editForm/Button.edit.display';
import baseEditForm from '../base/Base.form';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: [
          ...ButtonEditDisplay,
          {
            label: 'Remove bottom indents',
            labelPosition: 'left-left',
            type: 'checkbox',
            input: true,
            key: 'removeIndents',
            weight: 49,
            defaultValue: false
          },
          // Cause: https://citeck.atlassian.net/browse/ECOSUI-1426
          {
            type: 'checkbox',
            key: 'disableOnInvalid',
            label: 'Disable on Form Invalid',
            tooltip: 'This will disable this field if the form is invalid.',
            input: true,
            weight: 620,
            hidden: true
          },
          {
            type: 'checkbox',
            key: 'disableOnFormInvalid',
            label: 'Disable on Form Invalid',
            tooltip: 'This will disable this field if the form is invalid.',
            input: true,
            weight: 620
          }
        ]
      }
    ],
    ...extend
  );
}
