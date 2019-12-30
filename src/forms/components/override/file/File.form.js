import fileEditForm from 'formiojs/components/file/File.form';
import FileEditFile from './editForm/File.edit.file';

export default function(...extend) {
  const editForm = fileEditForm(...extend);

  const editFormTabs = editForm.components.find(item => item.key === 'tabs');
  const dataTab = editFormTabs.components.find(item => item.key === 'data');
  const fileTab = editFormTabs.components.find(item => item.key === 'file');

  // Remove component with 'defaultValue' key. Cause: https://citeck.atlassian.net/browse/ECOSCOM-2637
  // В поле defaultValue выводилось поле загрузки файла, обязательное к заполнению.
  // При нажатии на кнопку "Save" срабатывала валидация, форма не могла засабмититься из-за незаполненного поля.
  dataTab.components = dataTab.components.filter(item => item.key !== 'defaultValue');

  fileTab.components = FileEditFile;

  return editForm;
}
