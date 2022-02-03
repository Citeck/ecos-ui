import baseEditForm from '../../override/base/Base.form';
import ImportButtonEditDisplay from './editForm/ImportButton.edit.display';
import ImportButtonEditData from './editForm/ImportButton.edit.data';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: ImportButtonEditDisplay
      },
      {
        key: 'data',
        components: ImportButtonEditData
      }
    ],
    ...extend
  );
}
