import baseEditForm from '../../override/base/Base.form';
import TableFormEditDisplay from './editForm/TableForm.edit.display';
import TableFormEditData from './editForm/TableForm.edit.data';
import TableFormEditConditional from './editForm/TableForm.edit.conditional';
import TableFormEditImport from './editForm/TableForm.edit.import';

export default function(...extend) {
  const editForm = baseEditForm(
    [
      {
        key: 'display',
        components: TableFormEditDisplay
      },
      {
        label: 'Import',
        key: 'import',
        weight: 15,
        components: TableFormEditImport
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
