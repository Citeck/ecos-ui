import baseEditForm from 'formiojs/components/base/Base.form';
import TableFormDisplayData from './editForm/TableForm.display.data';
import TableFormEditData from './editForm/TableForm.edit.data';
import TableFormConditionalData from './editForm/TableForm.conditional.data';

export default function(...extend) {
  const editForm = baseEditForm(
    [
      {
        key: 'display',
        components: TableFormDisplayData
      },
      {
        key: 'data',
        components: TableFormEditData
      }
    ],
    ...extend
  );

  const editFormTabs = editForm.components.find(item => item.key === 'tabs');
  const conditionalTab = editFormTabs.components.find(item => item.key === 'conditional');

  conditionalTab.components = conditionalTab.components.concat(TableFormConditionalData);

  return editForm;
}
