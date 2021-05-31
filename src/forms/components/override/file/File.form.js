import fileEditForm from 'formiojs/components/file/File.form';
import FileEditFile from './editForm/File.edit.file';
import FileEditConditional from './editForm/File.edit.conditional';

export default function(...extend) {
  const editForm = fileEditForm(
    [
      {
        key: 'conditional',
        components: FileEditConditional
      },
      {
        key: 'file',
        components: FileEditFile
      }
    ],
    ...extend
  );

  const editFormTabs = editForm.components.find(item => item.key === 'tabs');
  const dataTab = editFormTabs.components.find(item => item.key === 'data');

  // Remove component with 'defaultValue' key. Cause: https://citeck.atlassian.net/browse/ECOSCOM-2637
  if (dataTab) {
    dataTab.components = dataTab.components.filter(item => item.key !== 'defaultValue');
  }

  return editForm;
}
