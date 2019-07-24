import baseEditForm from 'formiojs/components/base/Base.form';

import PanelEditDisplay from 'formiojs/components/panel/editForm/Panel.edit.display';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: [
          ...PanelEditDisplay,
          {
            label: 'Scrollable content',
            labelPosition: 'left-left',
            type: 'checkbox',
            input: true,
            key: 'scrollableContent',
            weight: 49,
            defaultValue: false
          }
        ]
      }
    ],
    ...extend
  );
}
