import baseEditForm from 'formiojs/components/base/Base.form';

import ButtonEditDisplay from 'formiojs/components/button/editForm/Button.edit.display';

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
          }
        ]
      }
    ],
    ...extend
  );
}
