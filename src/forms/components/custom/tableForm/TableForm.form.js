import baseEditForm from 'formiojs/components/base/Base.form';
import TableFormEditDisplay from './editForm/TableForm.edit.display';
import TableFormEditData from './editForm/TableForm.edit.data';
import TableFormEditConditional from './editForm/TableForm.edit.conditional';

export default function(...extend) {
  const editForm = baseEditForm(
    [
      {
        key: 'display',
        components: TableFormEditDisplay
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

  conditionalTab.components = conditionalTab.components.concat(TableFormEditConditional);

  return editForm;
}
