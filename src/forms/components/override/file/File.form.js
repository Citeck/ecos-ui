import fileEditForm from 'formiojs/components/file/File.form';
import FileEditFile from './editForm/File.edit.file';
import FileEditConditional from './editForm/File.edit.conditional';

export default function(...extend) {
  const editForm = fileEditForm(...extend);

  const editFormTabs = editForm.components.find(item => item.key === 'tabs');
  const dataTab = editFormTabs.components.find(item => item.key === 'data');
  const fileTab = editFormTabs.components.find(item => item.key === 'file');
  const conditionalTab = editFormTabs.components.find(item => item.key === 'conditional');

  // Remove component with 'defaultValue' key. Cause: https://citeck.atlassian.net/browse/ECOSCOM-2637
  dataTab.components = dataTab.components.filter(item => item.key !== 'defaultValue');
  conditionalTab.components = conditionalTab.components.concat(FileEditConditional);

  fileTab.components = FileEditFile;

  return editForm;
}
