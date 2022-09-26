import HTMLEditDisplay from 'formiojs/components/html/editForm/HTML.edit.display';
import HTMLEditLogic from 'formiojs/components/html/editForm/HTML.edit.logic';

import baseEditForm from '../base/Base.form';

export default function(...extend) {
  const editForm = baseEditForm(
    [
      {
        key: 'display',
        components: HTMLEditDisplay
      },
      {
        key: 'logic',
        components: HTMLEditLogic
      }
    ],
    ...extend
  );

  const editFormTabs = editForm.components.find(component => component.key === 'tabs');
  const displayFormTab = editFormTabs.components.find(component => component.key === 'display');

  if (displayFormTab) {
    const content = displayFormTab.components.find(component => component.key === 'content');

    if (content) {
      content.type = 'mlTextarea';
      content.editor = true;
      content.defaultValue = '';
    }
  }

  return editForm;
}
