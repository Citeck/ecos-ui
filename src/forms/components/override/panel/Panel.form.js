import PanelEditDisplay from 'formiojs/components/panel/editForm/Panel.edit.display';

import baseEditForm from '../base/Base.form';

export default function(...extend) {
  const editForm = baseEditForm(
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
            weight: 655,
            defaultValue: false
          }
        ]
      }
    ],
    ...extend
  );

  const editFormTabs = editForm.components.find(item => item.key === 'tabs');
  const dataTab = editFormTabs.components.find(item => item.key === 'data');

  // Remove component with 'defaultValue' key. Cause: https://citeck.atlassian.net/browse/ECOSCOM-2637
  // В поле defaultValue выводилось содержимое панели, включая потомков, обязательных к заполнению.
  // При нажатии на кнопку "Save" срабатывала валидация, форма не могла засабмититься из-за незаполненных полей.
  dataTab.components = dataTab.components.filter(item => item.key !== 'defaultValue');

  return editForm;
}
