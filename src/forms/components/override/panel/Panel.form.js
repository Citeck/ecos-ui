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
      },
      {
        key: 'data',
        components: [
          // Remove component with 'defaultValue' key. Cause: https://citeck.atlassian.net/browse/ECOSCOM-2637
          // В поле defaultValue выводилось содержимое панели, включая потомков, обязательных к заполнению.
          // При нажатии на кнопку "Save" срабатывала валидация, форма не могла засабмититься из-за незаполненных полей.
          { key: 'defaultValue', ignore: true }
        ]
      }
    ],
    ...extend
  );
}
