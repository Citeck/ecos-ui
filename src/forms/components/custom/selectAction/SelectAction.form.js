import baseEditForm from 'formiojs/components/base/Base.form';

import SelectActionEditData from './editForm/SelectAction.edit.data';
import SelectActionDisplayData from './editForm/SelectAction.edit.display';

export default function(...extend) {
  const editForm = baseEditForm(
    [
      {
        key: 'display',
        components: SelectActionDisplayData
      },
      {
        key: 'data',
        components: SelectActionEditData
      }
    ],

    ...extend
  );
  const editFormTabs = editForm.components.find(component => component.key === 'tabs');
  const dataFormTabIndex = editFormTabs.components.findIndex(component => component.key === 'data');

  if (!!~dataFormTabIndex) {
    editFormTabs.components[dataFormTabIndex].components = editFormTabs.components[dataFormTabIndex].components.filter(
      component => component.key === 'source.items'
    );
  }

  editFormTabs.components = editFormTabs.components.filter(component => component.key !== 'validation');

  return editForm;
}
